# pdf-signature-evaluator

An evaluator that checks the integrity of PDF signatures and optionally:
- matches the generated list of signers against a predefined expected list of signers.
- verifies that the date of signature is not older than a specific timestamp or interval.

### Additional requirements

Make sure you have the following requirements installed:

- swig
- gcc-5

You can install it with the following commands:

```bash
sudo apt update
sudo apt install swig gcc-5
```
