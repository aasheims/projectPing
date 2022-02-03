
Install Node.js v16:

$ cd ~
$ curl -sL https://deb.nodesource.com/setup_16.x -o nodesource_setup.sh
$ sudo bash nodesource_setup.sh
$ sudo apt install nodejs



Set up Ubuntu with essentials:

(if no python install that too ???)
$ sudo apt-get install -y build-essential



Set additional capabilities to Node.js:

$ sudo setcap cap_net_admin,cap_net_raw,cap_net_bind_service=+eip /usr/bin/node



Download and install projectPing

$ git clone https://github.com/aasheims/projectPing.git
$ cd projectPing
$ npm install



Install PM2 and set it up:

$ sudo npm install pm2@latest -g
$ pm2 start app.js --name projectPing
$ pm2 startup systemd
(Run the command from previous output, if next command is different)
$ sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ping --hp /home/ping
$ pm2 save
$ sudo systemctl start pm2-ping





