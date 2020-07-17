const { Translate } = require('@google-cloud/translate').v2;
const fs = require('fs');
const parser = require('subtitles-parser');
require('dotenv').config()
const translate = new Translate(
    {
        projectId: process.env.PROJECTID,
        keyFilename: process.env.KEY_FILENAME,
    }
);
const getSubtitle = filename => {
    const srt = fs.readFileSync(filename, 'utf8');
    return parser.fromSrt(srt);
}

const tranlateLine = async (text, target) => {
    const [translation] = await translate.translate(text, target);
    return translation;
}
const translateMovie = async (data, language) => {
    if (!Array.isArray(data)) return false;
    return data.reduce(async (total, movie, ind) => {
        const collection = await total;
        const { text } = movie;
        const translation = await tranlateLine(text, language)
        movie.text = translation;
        collection.push(movie);
        console.log(`${Math.floor((ind / data.length) * 100)}%`)
        return collection;
    }, Promise.resolve([]));
}
const formatFilename = (filename, language) => {
    const [newFileName] = filename.split('.');
    return `${newFileName}-${language}-translate.srt`;
}
const saveTranslation = (srt, filename, language) => {
    fs.writeFile(
        formatFilename(filename, language),
        parser.toSrt(srt),
        err => err ? console.log(err) : console.log('File Saved!')
    );
}
const getTotalCharacters = data => data.reduce((total, movie) => {
    const { text } = movie;
    total += text.split('').length;
    return total;
}, 0);
const handleTranslation = async (filename, language) => {
    try {
        const data = getSubtitle(filename);
        const totalCharacters = getTotalCharacters(data);
        console.log(totalCharacters, '[TOTAL CHARACTERS]')
        const translated = await translateMovie(data, language)
        saveTranslation(translated, filename, language);
    } catch (err) {
        console.log(err)
        return false;
    }

}
handleTranslation(process.argv[2], process.argv[3]);