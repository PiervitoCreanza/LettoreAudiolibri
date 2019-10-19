const path = require('path')
const downloaded_books_path= path.join(require('os').homedir(), 'Library/Application Support/Lettore_Audiolibri/Downloaded_books')
const book_path = path.join(downloaded_books_path, "libro.zip")
url = "http://www.libroparlato.org/webservice/dl.php?id=" + book_id + "&name=" + "libro" + "&user_id=2635&token=60e24bf4608d4dc95681973345c76c5149aad789"
url = "https://api.lettoreaudiolibri.it/download.php?id=" + 1
var request = require('request');
var fs = require('fs');

function downloadFile(file_url , targetPath){
    var req = request({
        method: 'GET',
        uri: file_url
    });
    var out = fs.createWriteStream(targetPath);
    req.pipe(out);
    req.on('end', function() {
        alert("File succesfully downloaded");
    });
}


downloadFile(url, book_path);