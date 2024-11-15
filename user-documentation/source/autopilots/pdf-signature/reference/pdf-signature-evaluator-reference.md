# Evaluator Background Information

An evaluator that checks the integrity of PDF signatures and optionally matches the generated list of signers against a predefined expected list of signers. You can choose to either check if at least one signer from the predefined list has signed the document or if all listed signers have signed the document (the latter being the default option).

## Environment variables

```{envvar} VALIDATE_SIGNERS
If we want to compare the list of actual signers with a predefined list of expected signers, this parameter should be set to `True`.
This will perform an additional check that will result in **red output** if the list of expected signers does not match the list of actual signers for each PDF file.
```

````{envvar} SIGNER_FILE_LOCATION
This is the path to the list of expected signers. This is a "yaml" file which contains the expected signers for each PDF file in the following format:

```yaml
first_pdf_name.pdf:
    - FIRST_SIGNER_NAME.LAST_NAME
    - SECOND_SIGNER_NAME.LAST_NAME
second_pdf_name.pdf:
    - FIRST_SIGNER_NAME.LAST_NAME
    - SECOND_SIGNER_NAME.LAST_NAME
```

The list contains the common names of the individual signatures. To find the common name of a signature, open a signed PDF file with PDF acrobat and click on the signature. A small report is displayed containing the common name of the signature.

This list should contain only PDF files that are expected to be signed.
The PDF file names should be unique.

````

```{envvar} PDF_LOCATION
The path to the directory containing the PDF files to be checked or the path pointing to a single file. The PDF files may be located in subfolders as this path is searched recursively.
```

```{envvar} CERTIFICATE_LOCATION
The path to the directory containing the certificate files against which the PDF files are to be checked.
```

## Example config

Below is an example configuration file that runs pdf-signature evaluator on a PDF document that's fetched from Artifactory using Artifactory fetcher. The autopilot (Artifactory fetcher + pdf-signature evaluator) is configured in lines: 7-20. Then the autopilot is used by the check 1 in line 35 which is part of requirement 1.15.

```{literalinclude} resources/qg-config.yaml
---
language: yaml
linenos:
emphasize-lines: 7-20, 35
---
```

## Expected Signers file

This file referenced by _SIGNER_FILE_LOCATION_ defines the signers that are expected to have signed a document for each file. Additionally an operator can be set to define, if at least one signer from the list or the full list of signers should have signed the document, with the latter being the default in case no operator was defined.

**Example 1:** 'all-of' operator defined: All listed signers have to have signed the example1.pdf file for a successful result.

```yaml
example1:
  operator: 'all-of'
  signers:
    - Jon.Doe
    - Jane.Doe
```

**Example 2:** 'one-of' operator defined: At least one of the listed signers has to have signed the example2.pdf file for a successful result.

```yaml
example2:
  operator: 'one-of'
  signers:
    - Jon.Doe
    - Jane.Doe
```

**Example 3:** No operator defined: The 'all-of' logic applies, all of the listed signers have to have signed the example3.pdf file for a successful result.

```yaml
example3:
    - Jon.Doe
    - Jane.Doe
```
