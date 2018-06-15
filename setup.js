#!/bin/bash
# Setup a ubuntu 14.04 server

# STEP - Remind user if running script as root
echo "Do not run this script as root or with root privileges if you intend to run "
echo "docker as a user other than root"
sleep 5


# STEP - Add automated updates as a cron job
printf "\nAdding automated updates once daily\n"
CRON_LINE="0 16 * * * /usr/bin/apt-get update && /usr/bin/apt-get -y dist-upgrade"
(sudo crontab -u root -l; echo "$CRON_LINE" ) | sudo crontab -u root -

# If crontab is empty it exits with 1, so set -e after editing crontab
# http://serverfault.com/questions/686860/add-cronjob-with-bash-script-no-crontab-for-root
set -e


# STEP - Setup Firewall (ufw)
# See further details here:
# https://www.digitalocean.com/community/tutorials/how-to-set-up-a-firewall-with-ufw-on-ubuntu-14-04
printf "\nSetting up firewall (ufw) rules\n"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh  # required so you can get access to the server
ufw allow https  # required by buildkite-agent service
ufw allow http

# restart ufw to ensure new rules are in effect
printf "\nStarting firewall (ufw) with new rules\n"
ufw --force reload

# start firewall if not already started
ufw --force enable

printf "\nFirewall status:\n"
ufw status verbose


# STEP - disable password access to ssh
# Note: ensure you have added your public key to the server first otherwise you will loose access!
printf "\ndisabling password access to ssh\n"

# existing entry could be any one of these
sed -i '/#ChallengeResponseAuthentication no/c\ChallengeResponseAuthentication no' /etc/ssh/sshd_config
sed -i '/#ChallengeResponseAuthentication yes/c\ChallengeResponseAuthentication no' /etc/ssh/sshd_config
sed -i '/ChallengeResponseAuthentication yes/c\ChallengeResponseAuthentication no' /etc/ssh/sshd_config

# existing entry could be any one of these
sed -i '/#PasswordAuthentication no/c\PasswordAuthentication no' /etc/ssh/sshd_config
sed -i '/#PasswordAuthentication yes/c\PasswordAuthentication no' /etc/ssh/sshd_config

# Restart ssh so new rules come into effect
# Note: this will kick you off the system
printf "restarting ssh service - you might get kicked off here..."
service ssh restart


# STEP - Update and upgrade
printf "Updating sources and upgrading packages"
apt-get update && apt-get dist-upgrade -y


# STEP - Add automated updates
apt-get install -y cron-apt


# STEP - install fail2ban
apt-get install -y fail2ban
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
service fail2ban stop
service fail2ban start


# STEP - Install docker
# Required for installation on ubuntu 14.04
apt-get install -y linux-image-extra-$(uname -r)
modprobe aufs

printf "\nChecking if docker installed\n"
{
    # check if docker installed
    which docker
} || {
    printf "\nDocker not present - installing docker\n"
    curl -sSL https://get.docker.com/ | sh
    usermod -aG docker $(whoami)
    printf "\n Docker version:\n"
    docker version
}

printf "\nChecking docker status\n"
service docker status


# STEP - Install docker-compose
printf "\nChecking if docker-compose installed\n"
{
    # check if docker-compose installed
    which docker-compose
} || {
    printf "\nDocker-compose not present - installing docker-compose\n"
    curl -L https://github.com/docker/compose/releases/download/1.12.0/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    printf "\nDocker-compose version:\n"
    docker-compose version
}


# STEP - Install utilities
# landscape-common lets you run landscape-sysinfo
apt-get install -y landscape-common git htop zip tree

# symlink zip
ln -s /usr/bin/zip /usr/local/bin


# STEP - add users to docker group
printf "\nYou should now add relevant users to the docker group so they can use docker e.g.\n"
echo "    $ usermod -aG docker $(whoami)"

printf "\nIf you ran this script manually and you were not logged in as root,"
printf "then log out then log back in again as your user permissions have changed.\n"


# STEP - add cleanup capabilities daily to docker, so docker doesn't eat all your HDD space
# Note: time is local server time (which may not be your time)
# If no existing crontab you will get this message (it is normal): no crontab for <user>
(crontab -l ; echo "0 17 * * * docker run --rm -v /var/run/docker.sock:/var/run/docker.sock zzrot/docker-clean") | sort - | uniq - | crontab -
