---
title: "Air-Gapped Upgrade with KubeKey"
keywords: "Air-Gapped, kubernetes, upgrade, kubesphere, 3.4.1"
description: "Use the offline package to upgrade Kubernetes and KubeSphere."
linkTitle: "Air-Gapped Upgrade with KubeKey"
weight: 7400
---
Air-gapped upgrade with KubeKey is recommended for users whose KubeSphere and Kubernetes were both deployed by [KubeKey](../../installing-on-linux/introduction/kubekey/). If your Kubernetes cluster was provisioned by yourself or cloud providers, refer to [Air-gapped Upgrade with ks-installer](../air-gapped-upgrade-with-ks-installer/).

## Prerequisites

- You need to have a KubeSphere cluster running v3.3.x. If your KubeSphere version is v3.2.x or earlier, upgrade to v3.3.x first.
- Your Kubernetes version must be v1.20.x, v1.21.x, v1.22.x, v1.23.x, * v1.24.x, * v1.25.x, and * v1.26.x. For Kubernetes versions with an asterisk, some features of edge nodes may be unavailable due to incompatability. Therefore, if you want to use edge nodes, you are advised to install Kubernetes v1.23.x.
- Read [Release Notes for 3.4.1](../../../v3.4/release/release-v341/) carefully.
- Back up any important component beforehand.
- A Docker registry. You need to have a Harbor or other Docker registries.
- Make sure every node can push and pull images from the Docker Registry.

## Major Updates

In KubeSphere 3.4.1, some changes have made on built-in roles and permissions of custom roles. Therefore, before you upgrade KubeSphere to 3.4.1, please note the following:

   - Change of built-in roles: Platform-level built-in roles `users-manager` and `workspace-manager` are removed. If an existing user has been bound to `users-manager` or `workspace-manager`, its role will be changed to `platform-regular` after the upgrade is completed. Role `platform-self-provisioner` is added. For more information about built-in roles, refer to [Create a user](../../quick-start/create-workspace-and-project).

   - Some permission of custom roles are removed:
       - Removed permissions of platform-level custom roles: user management, role management, and workspace management.
       - Removed permissions of workspace-level custom roles: user management, role management, and user group management.
       - Removed permissions of namespace-level custom roles: user management and role management.
       - After you upgrade KubeSphere to 3.4.1, custom roles will be retained, but removed permissions of the custom roles will be revoked.

## Upgrade KubeSphere and Kubernetes

Upgrading steps are different for single-node clusters (all-in-one) and multi-node clusters.

{{< notice info >}}

KubeKey upgrades Kubernetes from one MINOR version to the next MINOR version until the target version. For example, you may see the upgrading process going from 1.16 to 1.17 and to 1.18, instead of directly jumping to 1.18 from 1.16.

{{</ notice >}}


### System Requirements

| Systems                                                         | Minimum Requirements (Each node)            |
| --------------------------------------------------------------- | ------------------------------------------- |
| **Ubuntu** *16.04, 18.04, 20.04*                                       | CPU: 2 Cores, Memory: 4 G, Disk Space: 40 G |
| **Debian** *Buster, Stretch*                                    | CPU: 2 Cores, Memory: 4 G, Disk Space: 40 G |
| **CentOS** *7.x*                                                | CPU: 2 Cores, Memory: 4 G, Disk Space: 40 G |
| **Red Hat Enterprise Linux** *7*                                | CPU: 2 Cores, Memory: 4 G, Disk Space: 40 G |
| **SUSE Linux Enterprise Server** *15* **/openSUSE Leap** *15.2* | CPU: 2 Cores, Memory: 4 G, Disk Space: 40 G |

{{< notice note >}}

[KubeKey](https://github.com/whenegghitsrock/kubekey-carryon) uses `/var/lib/docker` as the default directory where all Docker related files, including images, are stored. It is recommended you add additional storage volumes with at least **100G** mounted to `/var/lib/docker` and `/mnt/registry` respectively. See [fdisk](https://www.computerhope.com/unix/fdisk.htm) command for reference.

{{</ notice >}}


### Step 1: Download KubeKey
1. 1. Run the following commands to download KubeKey.
   {{< tabs >}}

   {{< tab "Good network connections to GitHub/Googleapis" >}}

   Download KubeKey from its [GitHub Release Page](https://github.com/whenegghitsrock/kubekey-carryon/releases) or use the following command directly.

   ```bash
   curl -sfL https://kubesphere-carryon.top/pkg/downloadKubekey.sh | VERSION=v3.0.13 sh -
   ```

   {{</ tab >}}

   {{< tab "Poor network connections to GitHub/Googleapis" >}}

   Run the following command first to make sure you download KubeKey from the correct zone.

   ```bash
   export KKZONE=cn
   ```

   Run the following command to download KubeKey:

   ```bash
   curl -sfL https://kubesphere-carryon.top/pkg/downloadKubekey.sh | VERSION=v3.0.13 sh -
   ```
   {{</ tab >}}

   {{</ tabs >}}

2. After you uncompress the file, execute the following command to make `kk` executable:

   ```bash
   chmod +x kk
   ```

### Step 2: Prepare installation images

As you install KubeSphere and Kubernetes on Linux, you need to prepare an image package containing all the necessary images and download the Kubernetes binary file in advance.

1. Download the image list file `images-list.txt` from a machine that has access to Internet through the following command:

   ```bash
   curl -L -O https://github.com/whenegghitsrock/ks-installer-carryon/releases/download/v3.4.1/images-list.txt
   ```

   {{< notice note >}}

   This file lists images under `##+modulename` based on different modules. You can add your own images to this file following the same rule.

   {{</ notice >}} 

2. Download `offline-installation-tool.sh`.

   ```bash
   curl -L -O https://github.com/whenegghitsrock/ks-installer-carryon/releases/download/v3.4.1/offline-installation-tool.sh
   ```

3. Make the `.sh` file executable.

   ```bash
   chmod +x offline-installation-tool.sh
   ```

4. You can execute the command `./offline-installation-tool.sh -h` to see how to use the script:

   ```bash
   root@master:/home/ubuntu# ./offline-installation-tool.sh -h
   Usage:
   
     ./offline-installation-tool.sh [-l IMAGES-LIST] [-d IMAGES-DIR] [-r PRIVATE-REGISTRY] [-v KUBERNETES-VERSION ]
   
   Description:
     -b                     : save kubernetes' binaries.
     -d IMAGES-DIR          : the dir of files (tar.gz) which generated by `docker save`. default: /home/ubuntu/kubesphere-images
     -l IMAGES-LIST         : text file with list of images.
     -r PRIVATE-REGISTRY    : target private registry:port.
     -s                     : save model will be applied. Pull the images in the IMAGES-LIST and save images as a tar.gz file.
     -v KUBERNETES-VERSION  : download kubernetes' binaries. default: v1.17.9
     -h                     : usage message
   ```

5. Download the Kubernetes binary file.

   ```bash
   ./offline-installation-tool.sh -b -v v1.22.12 
   ```

   If you cannot access the object storage service of Google, run the following command instead to add the environment variable to change the source.

   ```bash
   export KKZONE=cn;./offline-installation-tool.sh -b -v v1.22.12 
   ```

   {{< notice note >}}

   - You can change the Kubernetes version downloaded based on your needs. Recommended Kubernetes versions for KubeSphere 3.4 are v1.20.x, v1.21.x, v1.22.x, v1.23.x, * v1.24.x, * v1.25.x, and * v1.26.x. For Kubernetes versions with an asterisk, some features of edge nodes may be unavailable due to incompatability. Therefore, if you want to use edge nodes, you are advised to install Kubernetes v1.23.x. If you do not specify a Kubernetes version, KubeKey will install Kubernetes v1.23.10 by default. For more information about supported Kubernetes versions, see [Support Matrix](../../installing-on-linux/introduction/kubekey/#support-matrix).

   - After you run the script, a folder `kubekey` is automatically created. Note that this file and `kk` must be placed in the same directory when you create the cluster later.

   {{</ notice >}} 

6. Pull images in `offline-installation-tool.sh`.

   ```bash
   ./offline-installation-tool.sh -s -l images-list.txt -d ./kubesphere-images
   ```

   {{< notice note >}}

   You can choose to pull images as needed. For example, you can delete `##k8s-images` and related images under it in `images-list.text` if you already have a Kubernetes cluster.

   {{</ notice >}} 

### Step 3: Push images to your private registry

Transfer your packaged image file to your local machine and execute the following command to push it to the registry.

```bash
./offline-installation-tool.sh -l images-list.txt -d ./kubesphere-images -r dockerhub.kubekey.local
```

   {{< notice note >}}

   The domain name is `dockerhub.kubekey.local` in the command. Make sure you use your **own registry address**.

   {{</ notice >}} 

### Air-gapped upgrade for all-in-one clusters

#### Example machines
| Host Name | IP          | Role                 | Port | URL                     |
| --------- | ----------- | -------------------- | ---- | ----------------------- |
| master    | 192.168.1.1 | Docker registry      | 5000 | http://192.168.1.1:5000 |
| master    | 192.168.1.1 | master, etcd, worker |      |                         |

#### Versions

|        | Kubernetes | KubeSphere |
| ------ | ---------- | ---------- |
| Before | v1.18.6    | v3.2.x     |
| After  | v1.22.12    | v3.3.x     |

#### Upgrade a cluster

In this example, KubeSphere is installed on a single node, and you need to specify a configuration file to add host information. Besides, for air-gapped installation, pay special attention to `.spec.registry.privateRegistry`, which must be set to **your own registry address**. For more information, see the following sections.

#### Create an example configuration file

Execute the following command to generate an example configuration file for installation:

```bash
./kk create config [--with-kubernetes version] [--with-kubesphere version] [(-f | --file) path]
```

For example:

```bash
./kk create config --with-kubernetes v1.22.12 --with-kubesphere v3.4.1 -f config-sample.yaml
```

{{< notice note >}}

Make sure the Kubernetes version is the one you downloaded.

{{</ notice >}}

#### Edit the configuration file

Edit the configuration file `config-sample.yaml`. Here is [an example for your reference](https://github.com/whenegghitsrock/kubekey-carryon/blob/release-2.2/docs/config-example.md).

   {{< notice warning >}} 

For air-gapped installation, you must specify `privateRegistry`, which is `dockerhub.kubekey.local` in this example.

   {{</ notice >}}

 Set `hosts` of your `config-sample.yaml` file:

```yaml
  hosts:
  - {name: ks.master, address: 192.168.1.1, internalAddress: 192.168.1.1, user: root, password: Qcloud@123}
  roleGroups:
    etcd:
    - ks.master
    control-plane:
    - ks.master
    worker:
    - ks.master
```

Set `privateRegistry` of your `config-sample.yaml` file:
```yaml
  registry:
    registryMirrors: []
    insecureRegistries: []
    privateRegistry: dockerhub.kubekey.local
```

#### Upgrade your single-node cluster to KubeSphere 3.4 and Kubernetes v1.22.12

```bash
./kk upgrade -f config-sample.yaml
```

To upgrade Kubernetes to a specific version, explicitly provide the version after the flag `--with-kubernetes`. Available versions are v1.20.x, v1.21.x, v1.22.x, v1.23.x, * v1.24.x, * v1.25.x, and * v1.26.x. For Kubernetes versions with an asterisk, some features of edge nodes may be unavailable due to incompatability. Therefore, if you want to use edge nodes, you are advised to install Kubernetes v1.23.x.

### Air-gapped upgrade for multi-node clusters

#### Example machines
| Host Name | IP          | Role            | Port | URL                     |
| --------- | ----------- | --------------- | ---- | ----------------------- |
| master    | 192.168.1.1 | Docker registry | 5000 | http://192.168.1.1:5000 |
| master    | 192.168.1.1 | master, etcd    |      |                         |
| slave1    | 192.168.1.2 | worker          |      |                         |
| slave1    | 192.168.1.3 | worker          |      |                         |


#### Versions

|        | Kubernetes | KubeSphere |
| ------ | ---------- | ---------- |
| Before | v1.18.6    | v3.2.x     |
| After  | v1.22.12    | v3.3.x     |

#### Upgrade a cluster

In this example, KubeSphere is installed on multiple nodes, so you need to specify a configuration file to add host information. Besides, for air-gapped installation, pay special attention to `.spec.registry.privateRegistry`, which must be set to **your own registry address**. For more information, see the following sections.

#### Create an example configuration file

   Execute the following command to generate an example configuration file for installation:

```bash
./kk create config [--with-kubernetes version] [--with-kubesphere version] [(-f | --file) path]
```

   For example:

```bash
./kk create config --with-kubernetes v1.22.12 --with-kubesphere v3.4.1 -f config-sample.yaml
```

{{< notice note >}}

Make sure the Kubernetes version is the one you downloaded.

{{</ notice >}}

#### Edit the configuration file

Edit the configuration file `config-sample.yaml`. Here is [an example for your reference](https://github.com/whenegghitsrock/kubekey-carryon/blob/release-2.2/docs/config-example.md).

   {{< notice warning >}} 

   For air-gapped installation, you must specify `privateRegistry`, which is `dockerhub.kubekey.local` in this example.

   {{</ notice >}}

Set `hosts` of your `config-sample.yaml` file:

```yaml
  hosts:
  - {name: ks.master, address: 192.168.1.1, internalAddress: 192.168.1.1, user: root, password: Qcloud@123}
  - {name: ks.slave1, address: 192.168.1.2, internalAddress: 192.168.1.2, user: root, privateKeyPath: "/root/.ssh/kp-qingcloud"}
  - {name: ks.slave2, address: 192.168.1.3, internalAddress: 192.168.1.3, user: root, privateKeyPath: "/root/.ssh/kp-qingcloud"}
  roleGroups:
    etcd:
    - ks.master
    control-plane:
    - ks.master
    worker:
    - ks.slave1
    - ks.slave2
```
Set `privateRegistry` of your `config-sample.yaml` file:
```yaml
  registry:
    registryMirrors: []
    insecureRegistries: []
    privateRegistry: dockerhub.kubekey.local
```

#### Upgrade your multi-node cluster to KubeSphere 3.4 and Kubernetes v1.22.12

```bash
./kk upgrade -f config-sample.yaml
```

To upgrade Kubernetes to a specific version, explicitly provide the version after the flag `--with-kubernetes`. Available versions are v1.20.x, v1.21.x, v1.22.x, v1.23.x, * v1.24.x, * v1.25.x, and * v1.26.x. For Kubernetes versions with an asterisk, some features of edge nodes may be unavailable due to incompatability. Therefore, if you want to use edge nodes, you are advised to install Kubernetes v1.23.x.
