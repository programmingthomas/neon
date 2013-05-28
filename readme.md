#Neon-2013

![Screenshot of login screen](https://raw.github.com/programmingthomas/neon-2013/master/screenshots/login.png "Screenshot of login screen")

Neon-2013 is a fork of [Neon](http://github.com/TDimaline/neon) that runs off of Go instead of Node.js. The aim is to create a simple educational micro blogging virtual learning environment (EMBVLE) that is a mix of Twitter, Tumblr, Google+'s circles and Moodle.

Fore more information (especially the API overview) please head to the [Wiki](http://github.com/ProgrammingThomas/neon-2013/wiki).

##Installation instructions
Here are the short and sweet installation instructions:

- Install [Go from Google](http://golang.org)
- Clone this repo
- On Mac/Linux/Windows? run the command 'export GOPATH=path/to/the/server/folder'
- Move your terminal to the server folder
- Run 'go build neon'
- Run 'go install neon'
- Run 'go build neon.go'
- Execute ./neon (Mac/Linux) or neon.exe
- Open your browser up at [http://localhost:8888](http://localhost:8888)
- If you want to stop the server (if you made a change to the HTML/CSS etc) press Ctrl + C (you can reboot by executing the executable again)

These instructions are a bit longer than the original Node installation instructions however Go requires that you have a 'workspace' folder for all of your packages. The problem arises that this repo can't just be cloned into the src/ folder of your existing workspace because it isn't just a Go package - it also has associated assets along with the main program. I'm planning on making this easier in the future.
