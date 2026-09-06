using System;
using System.IO.MemoryMappedFiles;
using System.Threading;

internal static class ProbeFixture
{
    public static void Main(string[] args)
    {
        if (args.Length == 0) { Thread.Sleep(60000); return; }
        using (var map = MemoryMappedFile.CreateNew(args[0], 8))
        using (var view = map.CreateViewAccessor())
        {
            view.Write(0, 2);
            view.Write(4, 0);
            Console.WriteLine("ready");
            string line;
            while ((line = Console.ReadLine()) != null)
            {
                view.Write(4, line == "connect" ? 1 : 0);
                Console.WriteLine(line);
            }
        }
    }
}
