const fs = require('fs')
const crypto = require('crypto')
const express = require('express')
const app = express()
const port = 6969
const users = []

app.get('/', (req, res) => {
    res.send('Hello World!')
})

//DEBUGGER DEMO - source https://www.digitalocean.com/community/tutorials/how-to-debug-node-js-with-the-built-in-debugger-and-chrome-devtools
app.get('/order-count', (req, res) => {
    let orders = [341, 454, 198, 264, 307];

    let totalOrders = 0;

    for (let i = 0; i < orders.length; i++) {
        totalOrders += orders[i];
    }

    res.send({ totalOrders })
})

//DEBUGGER DEMO 2
app.get('/word-count', (req, res) => {
    let sentences = readFile();
    let words = getWords(sentences);
    let wordCounts = countWords(words);

    let max = -Infinity;
    let mostPopular = '';

    Object.entries(wordCounts).forEach(([word, count]) => {
        if (stopwords.indexOf(word) === -1) {
            if (count > max) {
                max = count;
                mostPopular = word;
            }
        }
    });

    res.send({ result: `The most popular word in the text is "${mostPopular}" with ${max} occurrences` })
})
const stopwords = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', ''];
const readFile = () => {
    let data = fs.readFileSync('sentences.txt');
    let sentences = data.toString();
    return sentences;
};
const getWords = (text) => {
    let allSentences = text.split('\n');
    let flatSentence = allSentences.join(' ');
    let words = flatSentence.split(' ');
    words = words.map((word) => word.trim().toLowerCase());
    return words;
};
const countWords = (words) => {
    let map = {};
    words.forEach((word) => {
        if (word in map) { //!(word in map)
            map[word] = 1;
        } else {
            map[word] += 1;
        }
    });

    return map;
};
//WORD COUTER END

// Some leaking here.... - source https://scoutapm.com/blog/nodejs-memory-leaks
app.get('/leak', (req, res) => {

    leakyTimer = setInterval(function () {
        newElem = leakyFunc();
    }, 50);

    res.send('Oh no, I\'m leakin\'')
})
app.get('/flex-tape', (req, res) => {
    clearInterval(leakyTimer);

    res.send('No leaks with flex tape')
})

// Profiler command - ab -k -c 20 -n 25000 "http://localhost:6969/auth?username=matt&password=password"
// Profiler command - ab -k -c 20 -n 25000 "http://localhost:6969/auth-fixed?username=matt&password=password"
// Profiler demo - source https://nodejs.org/en/docs/guides/simple-profiling/
app.get('/newUser', (req, res) => {
    let username = req.query.username || '';
    const password = req.query.password || '';

    username = username.replace(/[!@#$%^&*]/g, '');

    if (!username || !password || users[username]) {
        return res.sendStatus(400);
    }

    const salt = crypto.randomBytes(128).toString('base64');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512');

    users[username] = { salt, hash };

    res.sendStatus(200);
});
app.get('/auth', (req, res) => {
    let username = req.query.username || '';
    const password = req.query.password || '';

    username = username.replace(/[!@#$%^&*]/g, '');

    if (!username || !password || !users[username]) {
        return res.sendStatus(400);
    }

    const { salt, hash } = users[username];
    const encryptHash = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512');

    if (crypto.timingSafeEqual(hash, encryptHash)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(401);
    }
});
app.get('/auth-fixed', (req, res) => {
    let username = req.query.username || '';
    const password = req.query.password || '';

    username = username.replace(/[!@#$%^&*]/g, '');

    if (!username || !password || !users[username]) {
        return res.sendStatus(400);
    }

    crypto.pbkdf2(password, users[username].salt, 10000, 512, 'sha512', (err, hash) => {
        if (users[username].hash.toString() === hash.toString()) {
            res.sendStatus(200);
        } else {
            res.sendStatus(401);
        }
    });
});

let leakyTimer;
var newElem;
function leakyFunc() {
    var someText = new Array(1000000);
    var elem = newElem;


    function child() {
        if (elem) return someText;
    }

    return function () {};
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
