# MajesticWarhorse

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.1.8.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.



Deploy Angular app in EC2
-------------------------

https://www.youtube.com/watch?v=w_OUokVnKYc

https://codetalk0.notion.site/Deploy-React-Angular-Application-On-AWS-with-EC2-CI-CD-Pipeline-Github-Action-Easy-And-Fast-De-317dc19afbb94b5ab0fc49093130ecb5

#Configuration for Connecting GitHub Action to EC2 Server Remotely:
DEPLOY_KEY: The private key used for accessing your EC2 server.
DEPLOY_HOST: The IP address or domain of your EC2 server.
DEPLOY_USER: The username used to access your EC2 server.
DEPLOY_PORT: The port used for SSH connections, typically 22.
DEPLOY_TARGET: The destination directory on your EC2 server where the build folder will be deployed.

#YML Code
name: Deploy Remotely
on:
  push:
    branches: [ main ]
 
jobs:
  Deploy-Remotely:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js 20.x to Build
      uses: actions/setup-node@v2
      with:
        node-version: 20.x
    - run: npm install
    - run: CI=false npm run build
    - name: Transfer Build Folder on EC2 Instance
      uses: easingthemes/ssh-deploy@v2.1.4
      env:
        SSH_PRIVATE_KEY: ${{ secrets.DEPLOY_KEY }}
        REMOTE_HOST: ${{ secrets.DEPLOY_HOST }}
        REMOTE_USER: ${{ secrets.DEPLOY_USER }}
        REMOTE_PORT: ${{ secrets.DEPLOY_PORT }}
        SOURCE: "build/"
        TARGET: ${{ secrets.DEPLOY_TARGET }}
    - name: Restart PM2 Service on EC2 Instance
      run: |
        echo "${{ secrets.DEPLOY_KEY }}" > deploy_key.pem  # Create a temporary key file
        chmod 400 deploy_key.pem                           # Set permissions for the key file
        ssh -o StrictHostKeyChecking=no -i "deploy_key.pem" -p ${{ secrets.DEPLOY_PORT }} ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} "pm2 restart next-app"
        rm deploy_key.pem    # Clean up the key file after use

#Commands for setting up NGINX on EC2 Terminal
sudo apt update
sudo apt install nginx
sudo systemctl status nginx
cd /etc/nginx/sites-available
sudo nano default

#Change Root Path in default
root /home/ubuntu/react-deploy

#Restart nginx
sudo service nginx restart

#Fix 500 & 403 error :  Allow Permissions
sudo chmod +x /home/ubuntu /home/ubuntu

#Fix 404 Error: change a line in …./sites-available/default 
location / {
			# First attempt to serve request as file, then
			# as directory, then fall back to displaying a 404.
			try_files $uri /index.html;
}

Add SSL Certificate
-------------------

#Update and Upgrade System Packages
sudo apt update
sudo apt upgrade -y

#Install Nginx
sudo apt install nginx -y

#Verify that Nginx is running
sudo systemctl status nginx

#Configure UFW to Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw enable

#Refreshes Package Information
sudo apt-get update

#Install software properties and add Certbot PPA
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update

#Install Certbot and Certbot Nginx Plugin
sudo apt install -y certbot python3-certbot-nginx

#Obtain an SSL Certificate
sudo certbot --nginx -d <domain name>

#Run Certbot for Nginx:
sudo certbot --nginx

#Set Up Automatic Renewal
sudo certbot renew --dry-run



Developer Document
------------------

Dashboard Overview Backend Logic

 if (isAdmin) {
    response = {
        totalTeachers: 0,
        totalStudents: 0,
        unassignedStudents: 0,
        totalViews: 0
    }
} else if (isTeacher) {
    response = {
        uploadedCourses: 0,
        assignedStudents: 0,
        totalDownloads: 0,
    }
} else {
    response = {
        toalCourses: 0,
        completedCourses: 0,
        coursesVisited: 0,
        taskSubmitted: 0
    }
}