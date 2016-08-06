JimJinJa-Agent
==============================

## SYNOPSIS
IoT based Home automation tool in Node.js with Raspberry Pi
http://www.jimjinja.net

## Howto

### Sign up JimJinJa website
http://www.jimjinja.net

### Set up JimJinJa agent application on your Raspberry Pi
Clone JimJinJa agent application from GitHub
```
$ git clone https://github.com/jimjinja/jimjinja-agent.git
```
Edit username/password
```
$ cd jimjinja-agent
$ vi config.json
```
Install packages
```
$ npm install
```
Start agent application
```
$ export NODE_ENV=production ; npm start
```
(Option) If you want to play a sample WAV file
```
$ cd $HOME/Music
$ wget http://www.freespecialeffects.co.uk/soundfx/sirens/police_s.wav
```

### Let's click task buttons
http://www.jimjinja.net
