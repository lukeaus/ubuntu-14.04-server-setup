# Ubuntu 14.04 Server Setup Script

Includes
* automatic updates
* firewall (ufw)
* security measures
* package updates
* fail2ban
* docker
* docker-compose
* docker cleanup
* utilities (landscape-common git htop zip tree)


## Setup


### Step 0
`git clone https://github.com/lukeaus/ubuntu-14.04-server-setup.git`

#### Step 1 
Make sure you have added your public key to the server.

If your public key is not already on the server:

`$ cat ~/.ssh/id_rsa.pub | ssh username@remote_host "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"`

`$ sudo service ssh restart`
  
If your public key is not already on the server when you logged in then logout and log
back in again now (otherwise you will get turfed off the system when ssh restarts).

#### Step 2 
Login to your new server:
`ssh root@<SERVER-IP-ADDRESS>`

Ensure you have added your local dev machine ssh key to the server first
(usually you do this when creating the server).


#### Step 3
Copy this script.
Open a new shell window and run:

`scp /path/to/this/script/setup.sh root@<SERVER-IP-ADDRESS>:/root`

#### Step 4
Make this script executable
Switch back to new server shell and run:

`chmod +x setup.sh`

#### Step 5
Run this script with root privileges:

`sudo ./setup.sh`
