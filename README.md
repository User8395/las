# LAS
The multi-distro app store

## Installing
As this is a pre-alpha, this README will be short.

Node.js is required to package LAS.


```
git clone https://github.com/User8395/las.git
cd las
npm install
npm run make
```

The AppImage will then be located in the `dist/` folder.

## Updates (bottom to top)

### March 1, 2023 (in the evening)
#### Added
+ "App info" screen
	- Installation capability is coming soon.

### March 1, 2023 (this was right after midnight...)
#### Added
+ Data from sources will now show up on the main page.

### April 27, 2023
#### Added
+ On every launch, data will be downloaded from [my example repository](https://github.com/User8395/example-las-source). The only way to override this is to remove the entry from `~/.las/sources.json`.
	- The sourcefiles folder will also be removed on every launch.

### April 5, 2023
#### Added
+ "Loading sources..." screen

+ On the first startup, LAS will now make a folder called `.las` located in the user's home folder (`~/` or `/home/user/`)

	-  `.las` will contain a sources file, an installed apps file, an apps folder, and a sourcefiles folder containing the `info.json` and `apps.json` files of sources.
