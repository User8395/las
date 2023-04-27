# LAS
The multi-distro app store

## Installing
As this is a pre-alpha, this README will be short, and will only cover installation steps for Debian-based systems. Support for other systems will come soon.

Node.js is required to package LAS.


```
git clone https://github.com/User8395/las.git
cd las
npm install
npm run make
```

The `.deb` package will then be located in the `out/` folder.

## Updates (bottom to top)

### April 27, 2023
#### Added
+ On every launch, data will be downloaded from [my example repository](https://github.com/User8395/example-las-source). The only way to override this is to remove the entry from `~/.las/sources.json`.
- The sourcefiles folder will also be removed. 

### April 5, 2023
#### Added
+ "Loading sources..." screen

+ "App info" screen

+ On the first startup, LAS will now make a folder called `.las` located in the user's home folder (`~/` or `/home/user/`)

- `.las` will contain a sources file, an installed apps file, an apps folder, and a sourcefiles folder containing the `info.json` and `apps.json` files of sources.