# LAS
The multi-distro app store (beta version)

## About
This is an app store aiming to provide a set of apps available for every Linux distribution

## Installing

### Prebuilts
Download a pre-relase from [the releases page](https://github.com/User8395/las/releases) or run the commands below to build from source

### Building
NOTE: The below commands will fetch data from the `master` branch, not this one.

Run `git checkout <nameOfThisBranch>` to fetch data from here



Download [NodeJS](https://nodejs.org) and run these commands:
```
git clone https://github.com/User8395/las.git
cd las
npm install
npm run make
```

The AppImage will then be located in the `dist/` folder.

To launch LAS for testing, run
```
npm run start
```

To update LAS, run
```
git pull
```
then re-run the packaging commands.

