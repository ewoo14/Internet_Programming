This is MyDiary homepage on that you can write your personal diary.
You have to install node.js and MySQL first.
All modules that you should install through npm are described in package.json and package-lock.json
In server.js you should fill out section with your SQL info.

### In server folder for running backend server
```
node server.js
```

Then diaryDB database will be created with tables in it automatically.

## In client folder for running frontend webpage
```
npm run serve
```

## Warning!
First of all, you have to unzip node_modules in client folder!!!

And when you running backend server, if error occurs like bcrypt,
```
npm uninstall bcrypt
```
and also
```
npm install bcrypt
```
