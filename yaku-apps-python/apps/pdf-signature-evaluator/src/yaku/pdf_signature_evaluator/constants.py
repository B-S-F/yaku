from pyhanko.sign.ades.report import AdESIndeterminate

ERROR_MESSAGES = {
    AdESIndeterminate.REVOKED_NO_POE: "The end-entity certificate has been revoked but there is no Proof of Existence",
    AdESIndeterminate.REVOKED_CA_NO_POE: "The certificate authority (CA) certificate in the certificate chain has been revoked, but there is no Proof of Existence",
    AdESIndeterminate.OUT_OF_BOUNDS_NO_POE: "The end-entity certificate has expired",
    AdESIndeterminate.NO_CERTIFICATE_CHAIN_FOUND: "Failed to build the verification path",
    AdESIndeterminate.CHAIN_CONSTRAINTS_FAILURE: "Certificate validation failed due to the following reasons: [Specific reason, e.g., malformed certificate, expired certificate, etc.]",
    AdESIndeterminate.NO_POE: "Certificate time validation failed because it is not within its valid time range",
}
