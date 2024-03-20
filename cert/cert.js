const forge = require('node-forge');

function readCertificateProperties(certPem) {
    const cert = forge.pki.certificateFromPem(certPem);

    let certProperties = {
        serialNumber: cert.serialNumber,
        issuer: cert.issuer.attributes.map(attr => `${attr.shortName}=${attr.value}`).join(', '),
        subject: cert.subject.attributes.map(attr => `${attr.shortName}=${attr.value}`).join(', '),
        validFrom: cert.validity.notBefore,
        validTo: cert.validity.notAfter,
        thumbprintSHA1: "",
        thumbprintSHA256: "",
        SANs: []
    };

    // Calculate SHA-1 thumbprint
    const sha1 = forge.md.sha1.create();
    sha1.update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes());
    certProperties.thumbprintSHA1 = sha1.digest().toHex().toUpperCase();

    // Calculate SHA-256 thumbprint
    const sha256 = forge.md.sha256.create();
    sha256.update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes());
    certProperties.thumbprintSHA256 = sha256.digest().toHex().toUpperCase();

    // Extract SANs if present
    const sanExtension = cert.extensions.find(ext => ext.name === 'subjectAltName');
    if (sanExtension) {
        certProperties.SANs = sanExtension.altNames.map(name => {
            if(name.type === 2) { // DNS
                return `DNS Name: ${name.value}`;
            } else if(name.type === 7) { // IP
                return `IP Address: ${name.ip}`;
            } else {
                return `Other Type: ${name.value}`;
            }
        });
    }

    return certProperties;
}

function generateSelfSignedCertificate(attrs, options = {}) {
    // Generate a keypair
    const keys = forge.pki.rsa.generateKeyPair(2048);
  
    // Create a new certificate
    const cert = forge.pki.createCertificate();
  
    // Set certificate properties
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1); // 1 year validity
  
    // Set the certificate subject and issuer
    const attributes = attrs || [
      { name: 'commonName', value: 'example.org' },
      { name: 'countryName', value: 'US' },
      { shortName: 'ST', value: 'Virginia' },
      { name: 'localityName', value: 'Blacksburg' },
      { name: 'organizationName', value: 'Test Company' },
      { shortName: 'OU', value: 'Test' }
    ];
    cert.setSubject(attributes);
    cert.setIssuer(attributes); // self-signed
  
    // Self-sign the certificate
    cert.sign(keys.privateKey, forge.md.sha256.create());
  
    // Convert a Forge certificate and private key to PEM
    const certPem = forge.pki.certificateToPem(cert);
    const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
  
    return {
      certificate: certPem,
      privateKey: privateKeyPem
    };
  }
  
  function splitPfxToPem(pfxBinaryString, password) {
    // Convert the binary string to a forge buffer
    const pfxDer = forge.util.createBuffer(pfxBinaryString, 'binary');
    // Decode the PFX using the password
    const pfx = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(pfxDer), false, password);
    
    // Initialize variables to hold the PEM-formatted private key and certificate
    let privateKeyPem = null;
    let certificatePem = null;

    // Loop through all the keybags (private keys) and certbags (certificates) to extract them
    // Assuming there is at least one private key and certificate in the PFX
    const bags = pfx.getBags({bagType: forge.pki.oids.pkcs8ShroudedKeyBag});
    const privateKey = bags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;
    privateKeyPem = forge.pki.privateKeyToPem(privateKey);

    const certBags = pfx.getBags({bagType: forge.pki.oids.certBag});
    // Assuming the first certificate is the one we want
    const certificate = certBags[forge.pki.oids.certBag][0].cert;
    certificatePem = forge.pki.certificateToPem(certificate);

    return {
        privateKey: privateKeyPem,
        certificate: certificatePem
    };
}

  // Example usage
 //const certDetails = generateSelfSignedCertificate();
 //console.log('Certificate:\n', certDetails.certificate);
 //console.log('Private Key:\n', certDetails.privateKey);

// Attach to window object for global access
window.readCertificateProperties = readCertificateProperties;
window.generateSelfSignedCertificate = generateSelfSignedCertificate;
window.splitPfxToPem = splitPfxToPem;
