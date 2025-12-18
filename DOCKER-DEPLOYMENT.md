# 🐳 Docker & Kubernetes Deployment Guide

Complete guide for deploying the Asnières Jujitsu application using Docker and Kubernetes.

## 📋 Table of Contents

- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)

---

## 🐳 Docker Deployment

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

### Quick Start with Docker Compose

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ajj-clone
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your values:
   ```env
   JWT_SECRET=your-secure-random-string
   DEFAULT_ADMIN_PASSWORD=your-secure-password
   EMAIL_USER=asnieresjujitsu@gmail.com
   EMAIL_PASSWORD=your-gmail-app-password
   ```

3. **Build and start the application**
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database**
   ```bash
   docker-compose exec app npm run init-db
   ```

5. **Access the application**
   - Website: http://localhost:3000
   - Admin: http://localhost:3000/admin/login.html

### Docker Commands

```bash
# Build the image
docker build -t ajj-app:latest .

# Run container manually
docker run -d \
  --name ajj-app \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e JWT_SECRET=your-secret \
  ajj-app:latest

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild after code changes
docker-compose up -d --build
```

### Database Backup

```bash
# Backup SQLite database
docker-compose exec app cp /app/data/admin.db /app/data/admin.db.backup

# Copy backup to host
docker cp ajj-app:/app/data/admin.db.backup ./backup-$(date +%Y%m%d).db

# Restore from backup
docker cp ./backup-20241218.db ajj-app:/app/data/admin.db
docker-compose restart app
```

---

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Container registry (Docker Hub, GCR, etc.)

### Architecture

```
┌─────────────────────────────────────────┐
│           Ingress Controller            │
│         (nginx/traefik/etc.)            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│          Service (ClusterIP)            │
│         ajj-app-service:80              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Deployment (2+ replicas)        │
│              ajj-app                    │
│                                         │
│  ┌─────────┐  ┌─────────┐             │
│  │  Pod 1  │  │  Pod 2  │             │
│  │ :3000   │  │ :3000   │             │
│  └────┬────┘  └────┬────┘             │
│       │            │                   │
│       └────────┬───┘                   │
└────────────────┼───────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      PersistentVolumeClaim (1Gi)        │
│           ajj-sqlite-pvc                │
│                                         │
│         SQLite Database File            │
│           /app/data/admin.db            │
└─────────────────────────────────────────┘
```

### Step-by-Step Deployment

#### 1. Build and Push Docker Image

```bash
# Build the image
docker build -t your-registry/ajj-app:v1.0.0 .

# Push to registry
docker push your-registry/ajj-app:v1.0.0

# Update deployment.yaml with your image
sed -i 's|ajj-app:latest|your-registry/ajj-app:v1.0.0|g' k8s/deployment.yaml
```

#### 2. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

#### 3. Create Secrets

**Option A: From YAML (Development)**
```bash
# Edit k8s/secret.yaml with your values first
kubectl apply -f k8s/secret.yaml
```

**Option B: From Command Line (Production - Recommended)**
```bash
kubectl create secret generic ajj-secrets \
  --from-literal=JWT_SECRET='your-jwt-secret-here' \
  --from-literal=DEFAULT_ADMIN_PASSWORD='your-admin-password' \
  --from-literal=EMAIL_USER='asnieresjujitsu@gmail.com' \
  --from-literal=EMAIL_PASSWORD='your-gmail-app-password' \
  --namespace=ajj-jujitsu
```

#### 4. Apply Configuration

```bash
# Apply ConfigMap
kubectl apply -f k8s/configmap.yaml

# Create PersistentVolume and PersistentVolumeClaim
kubectl apply -f k8s/persistentvolume.yaml
```

#### 5. Deploy Application

```bash
# Deploy the application
kubectl apply -f k8s/deployment.yaml

# Create service
kubectl apply -f k8s/service.yaml

# Apply ingress (optional)
kubectl apply -f k8s/ingress.yaml

# Apply HPA (optional)
kubectl apply -f k8s/hpa.yaml
```

#### 6. Initialize Database

```bash
# Get pod name
POD_NAME=$(kubectl get pods -n ajj-jujitsu -l app=ajj-app -o jsonpath='{.items[0].metadata.name}')

# Initialize database
kubectl exec -n ajj-jujitsu $POD_NAME -- npm run init-db
```

#### 7. Verify Deployment

```bash
# Check all resources
kubectl get all -n ajj-jujitsu

# Check pod status
kubectl get pods -n ajj-jujitsu

# View logs
kubectl logs -n ajj-jujitsu -l app=ajj-app -f

# Check service
kubectl get svc -n ajj-jujitsu

# Check ingress
kubectl get ingress -n ajj-jujitsu
```

### Access the Application

**Port Forward (Development)**
```bash
kubectl port-forward -n ajj-jujitsu svc/ajj-app-service 3000:80
```
Access: http://localhost:3000

**Via Ingress (Production)**
Update DNS to point to your ingress controller's IP, then access via your domain.

### Kubernetes Management Commands

```bash
# Scale deployment
kubectl scale deployment ajj-app --replicas=3 -n ajj-jujitsu

# Update image
kubectl set image deployment/ajj-app ajj-app=your-registry/ajj-app:v1.0.1 -n ajj-jujitsu

# Rollback deployment
kubectl rollout undo deployment/ajj-app -n ajj-jujitsu

# View rollout status
kubectl rollout status deployment/ajj-app -n ajj-jujitsu

# View rollout history
kubectl rollout history deployment/ajj-app -n ajj-jujitsu

# Restart deployment
kubectl rollout restart deployment/ajj-app -n ajj-jujitsu

# Delete all resources
kubectl delete namespace ajj-jujitsu
```

### Database Backup in Kubernetes

```bash
# Backup database
kubectl exec -n ajj-jujitsu $POD_NAME -- cp /app/data/admin.db /app/data/admin.db.backup

# Copy to local machine
kubectl cp ajj-jujitsu/$POD_NAME:/app/data/admin.db ./backup-$(date +%Y%m%d).db

# Restore from backup
kubectl cp ./backup-20241218.db ajj-jujitsu/$POD_NAME:/app/data/admin.db
kubectl rollout restart deployment/ajj-app -n ajj-jujitsu
```

---

## 🏗️ Architecture Details

### SQLite in Kubernetes

**Important Notes:**
- SQLite is file-based, so we use PersistentVolume for data persistence
- Multiple pods can read, but only one should write at a time
- For high-availability, consider migrating to PostgreSQL or MySQL
- Current setup uses `ReadWriteOnce` access mode

### Volume Configuration

The PersistentVolume uses `hostPath` for simplicity. For production:

**Cloud Providers:**
- **AWS**: Use EBS volumes
- **GCP**: Use Persistent Disks
- **Azure**: Use Azure Disks

**Example for AWS EBS:**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ajj-sqlite-pvc
spec:
  storageClassName: gp3
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### High Availability Considerations

For production HA setup:

1. **Use StatefulSet instead of Deployment**
2. **Migrate to PostgreSQL/MySQL** for true multi-pod writes
3. **Use ReadWriteMany volumes** if staying with file-based DB
4. **Implement database replication**

---

## 🐛 Troubleshooting

### Docker Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs app

# Check if port is in use
lsof -i :3000

# Rebuild without cache
docker-compose build --no-cache
```

**Database permission errors:**
```bash
# Fix permissions
docker-compose exec app chmod 755 /app/data
docker-compose exec app chmod 644 /app/data/admin.db
```

### Kubernetes Issues

**Pods not starting:**
```bash
# Describe pod
kubectl describe pod -n ajj-jujitsu <pod-name>

# Check events
kubectl get events -n ajj-jujitsu --sort-by='.lastTimestamp'

# Check logs
kubectl logs -n ajj-jujitsu <pod-name>
```

**PVC not binding:**
```bash
# Check PVC status
kubectl get pvc -n ajj-jujitsu

# Check PV
kubectl get pv

# Describe PVC
kubectl describe pvc ajj-sqlite-pvc -n ajj-jujitsu
```

**Image pull errors:**
```bash
# Check if image exists
docker pull your-registry/ajj-app:v1.0.0

# Create image pull secret if using private registry
kubectl create secret docker-registry regcred \
  --docker-server=your-registry \
  --docker-username=your-username \
  --docker-password=your-password \
  --namespace=ajj-jujitsu

# Add to deployment
spec:
  template:
    spec:
      imagePullSecrets:
      - name: regcred
```

**Database not persisting:**
```bash
# Check volume mount
kubectl exec -n ajj-jujitsu $POD_NAME -- ls -la /app/data

# Check PV path on node
kubectl get pv ajj-sqlite-pv -o yaml
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)

---

**Deployment configurations created by Bob**