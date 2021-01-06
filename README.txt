This repository contains a very small, fully working, Among Us server. (~1.4kb without comments)

Strictly not recommended for use.

Installation
============
Prerequisites:
	Node.js (https://nodejs.org)
	Git (Optional, https://git-scm.org)
	
Step 1: Install the repo
	If you have installed Git, enter a command prompt in any folder and use the command `git clone https://github.com/edqx/small-amongus-server` in order to clone the repository to your computer. Then enter the repository with `cd small-amongus-server`.
	
	If you have not installed Git, go ahead and download the zip file using this link: https://github.com/edqx/small-amongus-server/archive/master.zip. Extract the contents of the zip into any folder and enter it with a command prompt.
	
Step 2: Run the server
	There are no external dependencies for this project, so you can instantly run the project by writing `npm start` OR `node src/index.js`. There is also no configuration for the project.
	

Contribution
============
If you are contributing to the project, keep in mind the goal of the project. Skip certain flows that an Among Us server might carry out if it does not affect the game in a major way. Also, use JavaScript tactics such as the logical operators (&&, ||) rather than using if statements, as these can reduce file size by a lot. Other size reduction techniques will be suggested if you are not sure.

Also, do not focus on making the program secure or error-prone, and only support actual Among Us clients, even though other clients (e.g. programmable clients) may behave differently. The goal of the project is just for a working Among Us server, even if it may be extremely unstable and not suitable for use.

Notes
=====
This program should not be taken seriously, and should not be used for an actual Among Us server.

This project is under the MIT license, meaning I am not responsible for anything you do using this library.