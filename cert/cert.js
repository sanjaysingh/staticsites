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

// Attach to window object for global access
window.readCertificateProperties = readCertificateProperties;
