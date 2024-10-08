# Known Issues

Below we list all issues that you might face when deploying Yaku on you infrastructure and how to solve them.


## Argo Server address is not set correctly

If you get the following error message:
`[Yaku API] Error  2/14/2024, 2:38:14 PM [WorkflowManager] Starting workflow 56 (8:12) failed due to error TypeError: fetch failed - { stack: [ null ] }`

This means the Yaku service is not able to reach Argo workflows server.
By default, the `ARGO_SERVER` configuration environment variable is set to: 'https://argo-server:2746'. If you have configure it to something else, you need to configure this variable in Yaku deployment to match your argo service name and port.


## Workflow is not starting

If a workflow run pod is not started when you trigger a run, and no error logs show in the Yaku api pod logs, the reason might be that you don't have enough resources in your cluster to start the run pods. Scaling the cluster should solve the issue.
