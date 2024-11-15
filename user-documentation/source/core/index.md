# {{ PNAME }} Core

The {{ PNAME }} service consists of several layers:

- **Clients**: the service can be accessed by using different clients, e.g., the web
  interface, the [REST API](../reference/rest-api/index), or the [CLI client](../cli/index).
- **REST API**: the web service offers a [REST API](../reference/rest-api/index)
  which connects the clients to the backend.
- **Core**: the core of {{ PNAME }} is the workflow engine which takes a
  {{ PNAME }} {term}`configuration` and executes it by stepping through all
  automation and checks, and executing the {term}`autopilots <autopilot>`.

```{mermaid}
flowchart LR
    subgraph c["Clients"]
      c1["REST API Client"]
      c2["CLI Client"]
      c3["Web UI"]
    end
    subgraph s["Yaku Service"]
      s1["REST API"]
      s1 -- "sends<br>configuration to" --> b1
      subgraph o["Core"]
        b1["Workflow Management"]
        b2["Secrets Management"]
        ba1["Autopilot"]
        ba2["Autopilot"]
        b1 -- "executes" --> ba1
        b1 -- "executes" --> ba2
        b1 -- "retrieves<br>secrets from" --> b2
        b1 -- "manages<br>(environment)<br>variables" --> b1
      end
    end
    c1 -- "calls" --> s1
    c2 -- "calls" --> s1
    c3 -- "calls" --> s1

    class o mermaid-fill-primary
    class c,c1,c2,c3,s,s1,b1,b2,ba1,ba2 mermaid-no-fill
```

This section of the documentation deals with the **Core** part and explains
the details of:

- how a [configuration](./configuration/index) looks like
- how [autopilots](./configuration/main-config-file.md#autopilots) can be added to a configuration
- how the [autopilot execution context](autopilot-context) looks like
- how and where you can define [environment variables](./environment-variables/index)
- how you can define and use [secrets](./secrets/index)

See below for a full list of chapters.

## Chapters

```{toctree}
:maxdepth: 1

configuration/index
environment-variables/index
secrets/index
run-variables/index
custom-apps/index
autopilot-context
```
