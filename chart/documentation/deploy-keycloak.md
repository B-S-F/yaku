# A Guide to Deploying Keycloak Identity and Access Management Solution

Yaku depends on Keycloak for the management of user authentication and authorization. Keycloak is a an open-source Identity and Access Management (IAM) solution that supports various protocols such as OpenID Connect, OAuth 2.0, and SAML. Official documentation for Keycloak can be found [here](https://www.keycloak.org/documentation.html).

In this document, we will provide you with a step-by-step guide on how to deploy a Keycloak instance on a Kubernetes cluster and how to configure the instance for Yaku. 

## Deploying Keycloak

If there is no centrally hosted Keycloak instance in your organization that you can use, you need to run your own Keycloak instance to be used by Yaku.

Skip this section to [Configure Keycloak guide](./configure-keycloak.md) if you already have a Keycloak instance that you can use.

Please note that this guide is meant to guide you deploy Keycloak with basic working configuration. You may need to customize the configuration to meet your organization's requirements.


### Deployment


#### Configure a Database

In this example, we are using a PostgreSQL database for Keycloak. You can use other databases supported by Keycloak. Please refer to the [official documentation](https://www.keycloak.org/docs/latest/server_installation/index.html#_database) for more information.

Below is an example of a PostgreSQL deployment and service. It also creates a persistent volume claim for the database. You can use this example as a starting point and customize it to meet your organization's requirements.

Before you deploy the database, you need to create a secret that contains the database credentials. The secret will be used by the database deployment to connect to the database.

    ```bash
    kubectl create secret generic postgres-credentials --from-literal=username=XXX --from-literal=password=XXX
    ```

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: keycloak-postgres
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Mi
  storageClassName: default
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak-postgres
  labels:
    app: kc-postgres-db
spec:
  ports:
  - port: 5432
    protocol: TCP
    targetPort: 5432
  selector:
    app: kc-postgres-db
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kc-postgres-db
spec:
  selector:
    matchLabels:
      app: kc-postgres-db
  template:
    metadata:
      labels:
        app: kc-postgres-db
    spec:
      containers:
      - name: kc-postgres-db
        image: postgres:13-alpine
        env:
        - name: POSTGRES_DB
          value: keycloak
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
        - name: PGDATA
          value: /var/lib/postgresql/data/db-files/
        volumeMounts:
        - name: pvc-data
          mountPath: /var/lib/postgresql/data
        ports:
        - containerPort: 5432
      volumes: 
      - name: pvc-data
        persistentVolumeClaim:
          claimName: keycloak-postgres
```

#### Create Admin Console Credentials Secret

Keycloak Admin Console should be secured with a username and password. Choose a strong and unique password for the Keycloak admin user and create a kubernetes secret with the following command:

    ```bash
    kubectl create secret generic keycloak-credentials --from-literal=username=XXX --from-literal=password=XXX
    ```

It's recommended to regularly update your admin password.


#### Create Default Realm ConfigMap

[yaku-realm-configmap.yaml file](./tools/yaku-realm-configmap.yaml) contains a pre-configured Keycloak realm with the name yaku. Deploy this config map and it will be used in the next step by the Keycloak deployment to import the realm on startup.
#### deployment.yml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak
  labels:
    app: keycloak
spec:
  replicas: 1
  selector:
    matchLabels:
      app: keycloak
  template:
    metadata:
      labels:
        app: keycloak
    spec:
      containers:
      - name: keycloak
        image: quay.io/keycloak/keycloak:23.0.7
        args: ["start", "--cache-stack=kubernetes", "--import-realm"]
        env:
        - name: KEYCLOAK_ADMIN
          valueFrom:
            secretKeyRef:
              name: keycloak-credentials
              key: username
        - name: KEYCLOAK_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: keycloak-credentials
              key: password
        - name: KC_PROXY
          value: "edge"
        - name: jgroups.dns.query
          value: "keycloak"
        - name: PROXY_ADDRESS_FORWARDING
          value: "true"
        - name: KC_HEALTH_ENABLED
          value: "true"
        - name: KC_METRICS_ENABLED
          value: "true"
        - name: KC_HTTP_ENABLED
          value: "true"
        - name: KC_HTTP_RELATIVE_PATH
          value: "/auth"
        - name: KC_HOSTNAME_URL
          value: "https://your-domain.com/keycloak/auth/"
        - name: KC_HOSTNAME_ADMIN_URL
          value: "https://your-domain.com/keycloak/auth/"
        - name: KC_DB
          value: "postgres"
        - name: KC_DB_URL
          value: "jdbc:postgresql://keycloak-postgres/keycloak"
        - name: KC_DB_URL_HOST
          value: "keycloak-postgres"
        - name: KC_DB_URL_PORT
          value: "5432"
        - name: KC_DB_URL_DATABASE
          value: "keycloak"
        - name: KC_DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: username
        - name: KC_DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
        ports:
        - name: http
          containerPort: 8080
        - name: jgroups
          containerPort: 7600
        volumeMounts:
            - name: default-realm
              mountPath: /opt/keycloak/data/import/
      volumes:
        - name: default-realm
          configMap:
            name: yaku-realm-config
```

`KC_HOSTNAME_URL` and `KC_HOSTNAME_ADMIN_URL` need to be changed based on the hostname you have in your ingress resource.

#### service.yml
    
```yaml
apiVersion: v1
kind: Service
metadata:
  name: keycloak
  labels:
    app: keycloak
spec:
  ports:
  - name: http
    port: 8080
    targetPort: 8080
  selector:
    app: keycloak
  type: ClusterIP
```

#### ingress.yml

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: keycloak-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/proxy-body-size: 2500m
    nginx.ingress.kubernetes.io/proxy-buffer-size: 12k
    nginx.ingress.kubernetes.io/rewrite-target: /$1
spec:
  rules:
  - host: <your-domain.com>
    http:
      paths:
      - backend:
          service:
            name: keycloak
            port:
              number: 8080
        path: /keycloak/(.*)
        pathType: ImplementationSpecific
```



If the pod is up and running, you can access keycloak on: https://your-domain.com/keycloak/auth/






