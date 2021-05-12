# PANDeagle
PANDeagle -- visualizing and exploring PANDA results

This project is inspired by [asidstory](https://github.com/panda-re/panda/tree/master/panda/plugins/asidstory)

## Installation 

Clone the repository
```
git clone git@github.com:panda-re/pandeagle.git
cd pandeagle
```
This project needs NPM to work, if not already installed:
```
sudo apt install npm
```
Use NPM to install dependency packages
```
npm install
```
Start the application (running on PORT 3000 on local machine)
The database connected by the application is specified in __config.json__
```
npm start
```
Now access the application by going to http://localhost:3000 in the browser

## Documentation

You can find the documentation at [index.html](doc/index.html)

To re-generate the documentation in the doc folder, simply run `jsdoc public/components/ -d doc` after you clone this repo
