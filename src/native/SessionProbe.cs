using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;

internal static class SessionProbe
{
    private static readonly JavaScriptSerializer Json = new JavaScriptSerializer();

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct ProcessEntry
    {
        public uint size, usage, pid;
        public IntPtr heap;
        public uint module, threads, parentPid;
        public int priority;
        public uint flags;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)] public string name;
    }
    [DllImport("kernel32.dll", SetLastError = true)] private static extern IntPtr CreateToolhelp32Snapshot(uint flags, uint pid);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] private static extern bool Process32FirstW(IntPtr snapshot, ref ProcessEntry entry);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] private static extern bool Process32NextW(IntPtr snapshot, ref ProcessEntry entry);
    [DllImport("kernel32.dll")] private static extern bool CloseHandle(IntPtr handle);

    private static Dictionary<int, int> Parents()
    {
        var result = new Dictionary<int, int>();
        var handle = CreateToolhelp32Snapshot(2, 0);
        if (handle == new IntPtr(-1)) return result;
        try
        {
            var entry = new ProcessEntry { size = (uint)Marshal.SizeOf(typeof(ProcessEntry)) };
            if (Process32FirstW(handle, ref entry))
                do { result[(int)entry.pid] = (int)entry.parentPid; } while (Process32NextW(handle, ref entry));
        }
        finally { CloseHandle(handle); }
        return result;
    }

    private static string StartToken(Process process) { return process.StartTime.ToUniversalTime().Ticks.ToString(); }

    private static object Snapshot(string mapName)
    {
        bool connected = false;
        string sdkError = null;
        try
        {
            using (var map = MemoryMappedFile.OpenExisting(mapName, MemoryMappedFileRights.Read))
            using (var view = map.CreateViewAccessor(0, 8, MemoryMappedFileAccess.Read))
            {
                // irsdk_header begins with the API version and status bitfield.
                connected = view.ReadInt32(0) > 0 && (view.ReadInt32(4) & 1) != 0;
            }
        }
        catch (FileNotFoundException) { }
        catch (Exception ex) { sdkError = ex.Message; }

        var processes = new List<object>();
        var parents = Parents();
        foreach (var process in Process.GetProcesses())
        {
            using (process)
            {
                try
                {
                    string file = null;
                    string startedAt = null;
                    try { file = process.MainModule.FileName; } catch { }
                    try { startedAt = StartToken(process); } catch { }
                    int parentPid;
                    parents.TryGetValue(process.Id, out parentPid);
                    processes.Add(new { pid = process.Id, parentPid, startedAt, name = process.ProcessName + ".exe", path = file });
                }
                catch (InvalidOperationException) { }
                catch (System.ComponentModel.Win32Exception) { }
            }
        }
        return new { connected, sdkError, processes };
    }

    public static int Main(string[] args)
    {
        Console.OutputEncoding = new UTF8Encoding(false);
        try
        {
            if (args.Length == 3 && args[0] == "--stop")
            {
                using (var target = Process.GetProcessById(Int32.Parse(args[1])))
                {
                    if (StartToken(target) != args[2]) throw new InvalidOperationException("O processo original ja foi encerrado.");
                    if (!target.CloseMainWindow() || !target.WaitForExit(3000)) target.Kill();
                }
                return 0;
            }
            if (args.Length == 2 && args[0] == "--metadata")
            {
                var info = FileVersionInfo.GetVersionInfo(args[1]);
                Console.WriteLine(Json.Serialize(new { name = !String.IsNullOrWhiteSpace(info.ProductName) ? info.ProductName : info.FileDescription }));
                return 0;
            }
            if (args.Length == 1 && args[0] == "--once")
            {
                Console.WriteLine(Json.Serialize(Snapshot("Local\\IRSDKMemMapFileName")));
                return 0;
            }
            if (args.Length < 1 || args.Length > 2) return 2;
            var mapName = args.Length == 2 ? args[1] : "Local\\IRSDKMemMapFileName";
            using (var parent = Process.GetProcessById(Int32.Parse(args[0])))
            {
                while (!parent.HasExited)
                {
                    Console.WriteLine(Json.Serialize(Snapshot(mapName)));
                    Console.Out.Flush();
                    Thread.Sleep(1000);
                }
            }
            return 0;
        }
        catch (IOException) { return 0; }
        catch (Exception ex) { Console.Error.WriteLine(ex.Message); return 1; }
    }
}
