# <img src="img/srxeditor.png" style="float:left; height:48px; margin:4px" alt="SRXEditor logo"> SRXEditor

SRXEditor is a cross-platform editor of segmentation rules, designed to use [Segmentation Rules eXchange (SRX) 2.0](http://web.archive.org/web/20090709131535/http://www.lisa.org/fileadmin/standards/srx20.html), the open XML-based standard for segmentation published by LISA.

You can use SRXEditor to create new SRX files and edit existing ones. It also can be used for testing segmentation rules to ensure that they break text as expected.

SRXEditor includes a sample file in SRX 2.0 format with a default set of segmentation rules supporting most standard cases. It also includes segmentation rules specific for these languages:

 | | | | |
 |--- | --- | --- | ---|
 | Catalan | German | Chinese | Italian |
 | Czech | Japanese | Danish |  Polish |
 | Dutch |  Portuguese |  English | Spanish |
 | Finnish | Swedish | French | Thai |

Ready to use installers are available at [SRXEditor's Home Page](https://www.maxprograms.com/products/srxeditor.html).

## Build Requirements

- node.js v24.14.0 (LTS) or later (<https://nodejs.org/>)

### Build Procedure

- Clone this repository
- Run `npm install`

```bash
git clone https://github.com/maxprograms-com/SRXEditor.git
cd SRXEditor
npm install
```

### Running the Application

- Run `npm start`
