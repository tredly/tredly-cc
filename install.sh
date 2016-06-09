#!/usr/local/bin/bash

set -e

# make sure this user is root
euid=$( id -u )
if test $euid != 0
then
   echo "Please run this installer as root." 1>&2
   exit 1
fi

BINDIR="/tredly/ptn/default/data/tredly-cc"

echo -e "\u001b[32m\u001b[1m################\u001b[22m\u001b[39m"
echo -e "\u001b[32m\u001b[1m### Installing Tredly Command Center... \u001b[22m\u001b[39m"

echo -e "\u001b[32m\u001b[1m### Installing Node.js... \u001b[22m\u001b[39m"
pkg install -y node

echo -e "\u001b[32m\u001b[1m### Installing NPM... \u001b[22m\u001b[39m"
pkg install -y npm

echo -e "\u001b[32m\u001b[1m### Installing RubyGems... \u001b[22m\u001b[39m"
pkg install -y ruby21-gems

echo -e "\u001b[32m\u001b[1m### Installing Compass... \u001b[22m\u001b[39m"
gem update --system
gem install compass
gem install ceaser-easing
gem install susy
gem install breakpoint

echo -e "\u001b[32m\u001b[1m### Installing Bower... \u001b[22m\u001b[39m"
npm install bower -g

echo -e "\u001b[32m\u001b[1m### Installing NPM dependencies... \u001b[22m\u001b[39m"
npm install --only=development

echo -e "\u001b[32m\u001b[1m### Installing Bower dependencies... \u001b[22m\u001b[39m"
bower install --config.interactive=false --allow-root

echo -e "\u001b[32m\u001b[1m### Building UI... \u001b[22m\u001b[39m"
npm run build

echo -e "\u001b[32m\u001b[1m### Moving installation folder... \u001b[22m\u001b[39m"
rm -rf "${BINDIR}"
mkdir -p "${BINDIR}/"
mv -f ./tredlycc /etc/rc.d/
chmod 555 /etc/rc.d/tredlycc
echo tredlycc_enable=\"YES\" >> /etc/rc.conf
mv -f ./dist/* "${BINDIR}/"
rm -rf ./*
cd "${BINDIR}/"
pwd

echo -e "\u001b[32m\u001b[1m### Processing Tredly Command Center URL... \u001b[22m\u001b[39m"
if [ -z "$1" ]
    then
        echo -e "\u001b[32m\u001b[1m    Using default URL: cc.example.com \u001b[22m\u001b[39m"
    else
        echo -e "\u001b[32m\u001b[1m    Using custom URL: $1 \u001b[22m\u001b[39m"
        sed -i -e "s,cc.example.com,$1,g" "${BINDIR}/Tredlyfile"
        sed -i -e "s,cc.example.com,$1,g" "${BINDIR}/server.js"
fi

echo -e "\u001b[32m\u001b[1m### Generating SSL Certificates... \u001b[22m\u001b[39m"
./ssl.sh
rm ./.ssl/server.csr
rm ./.ssl/server.key.org

echo -e "\u001b[32m\u001b[1m### ################"
echo -e "\u001b[32m\u001b[1m### Tredly Command Center Installation complete. \u001b[22m\u001b[39m"

