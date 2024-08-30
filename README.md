# simple-network-webapp
A sigmaj.js based application for visualising graph networks in the browser.
Originally developed for a bioinformatics project, this webapplication can be used to display any basic graph network and features the option to search for nodes.

A live version can be found at:
https://www.bosse-lab.org/herpesclusters/

The node modules used in this project are
```
├── graphology@0.25.4
├── sigma@2.4.0
└── vite@5.4.2
```
A simple way to test the application locally is installing the dependencies via the node.js package manager

```bash
npm install sigma graphology vite
```

and then calling

`npx vite`

inside the project root folder. This will start vite's local development server.
To bundle dependencies and produce a self-containted static webpage, run

`npx vite build`

inside the project root folder. This will place the webapplication into the `dist` folder.
