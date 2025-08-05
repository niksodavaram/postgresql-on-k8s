# 🐘 PostgreSQL on Kubernetes (Minikube) Template

A developer-friendly template for running a **dockerized PostgreSQL database** on **Kubernetes** (using Minikube). Includes sample schema, admin access, and instructions for practicing SQL and DB admin skills. Ideal for interviews, learning, and demos.

---

## 🎯 Features

- PostgreSQL 16 running via Kubernetes Deployment
- Exposed via NodePort for easy local access
- Auto-initializes schema from SQL file
- **Optional:** pgAdmin for web-based DB administration
- Ready for custom schema and query practice!

---

## 🚀 Quick Start

### 1. **Install Requirements**
- [Docker](https://docs.docker.com/get-docker/)
- [Minikube](https://minikube.sigs.k8s.io/docs/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

### 2. **Start Minikube**
```sh
minikube start
```

### 3. Apply Kubernetes Manifests
```sh
kubectl apply -f k8s/
```
### 4. Access PostgreSQL

Find Minikube IP:
```sh
minikube ip
```
Suppose it returns 192.168.49.2

Connect locally:

    Host: 192.168.49.2
    Port: 30007
    User: devuser
    Password: devpass
    Database: devdb

You can use psql, DBeaver, or any PostgreSQL client.

### 5. (Optional) Access pgAdmin

Go to http://192.168.49.2:30008 in your browser
Login:
    Email: admin@admin.com
    Password: admin

🗄️ Example Schema
sql

-- db/init.sql
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);
```

🧑‍💻 Practice / Showcase

Add/modify schema in db/init.sql and update the ConfigMap in k8s/postgres-deployment.yaml
Practice queries:
```sql

INSERT INTO users (username, email) VALUES ('alice', 'alice@example.com');
SELECT * FROM users;

Use pgAdmin or psql for DB admin tasks (create, drop, backup, restore, etc.)
```
Document your queries and schema changes in the repo!

🎓 For Interviews / Demos

Walk through README.md and k8s/ manifests
Show schema design, query skills, and db admin via SQL or pgAdmin
Easily reset by deleting/re-applying manifests:
```sh

kubectl delete -f k8s/
kubectl apply -f k8s/
```

📚 Resources

PostgreSQL Docs
pgAdmin
Kubernetes ConfigMap

📜 License

MIT