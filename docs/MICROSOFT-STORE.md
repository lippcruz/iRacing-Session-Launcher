# Publicação na Microsoft Store / Microsoft Store publishing

## Português

O pacote Store é gerado com `npm run dist:store` e aparece em `release/<versão>/`.
Envie o arquivo `.appx` pela seção **Packages** do produto no Partner Center. A Store
assina o pacote após a certificação; o arquivo local sem assinatura é esperado e não
deve ser oferecido para instalação direta.

Identidade pública do pacote:

- Identity Name: `LippCruz.iRacingSessionLauncher`
- Publisher: `CN=1E129E8D-2F04-4242-84F0-E2666F414644`
- Publisher Display Name: `Lipp Cruz`
- Application ID: `iRacingSessionLauncher`
- Capability: `runFullTrust`

Também são necessários um **preço pago**, classificação etária, descrições e imagens
em Português e English e notas para certificação explicando que `runFullTrust` é usado
para detectar o processo local do iRacing e iniciar/encerrar os apps escolhidos.

Esses identificadores são públicos. Nunca versione senha, MFA, documentos, tokens,
chaves privadas, certificados `.pfx` ou senhas de certificado.

## English

Build the Store package with `npm run dist:store`; it is written under
`release/<version>/`. Upload the `.appx` in the product's **Packages** section in
Partner Center. Microsoft signs it after certification. The local unsigned file is
expected and must not be offered for direct installation.

Choose a **paid price**, complete the age rating, add Portuguese and English listings
and images, and explain in certification notes that `runFullTrust` detects the local
iRacing process and starts/stops only user-selected applications.

The package identifiers above are public. Never commit passwords, MFA data, identity
documents, tokens, private keys, `.pfx` certificates, or certificate passwords.
