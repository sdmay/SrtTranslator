const { Translate } = require('@google-cloud/translate').v2;
const fs = require('fs');
const parser = require('subtitles-parser');
require('dotenv').config
const projectId = process.env.PROJECTID;
const translate = new Translate(
    {
        projectId,
        keyFilename: process.env.KEY_FILENAME //eg my-project-0fwewexyz.json
    }
);
const getSubtitle = filename => {
    const srt = fs.readFileSync(filename, 'utf8');
    const data = parser.fromSrt(srt);
    return data;
}

const tranlateLine = async (text, target) => {
    const [translation] = await translate.translate(text, target);
    return translation;
}
const translateMovie = async (data, language) => {
    if (!Array.isArray(data)) return false;
    const translatedMovie = await data.reduce(async (total, movie, ind) => {
        const collection = await total;
        // await new Promise(resolve => setTimeout(resolve, 400));
        const { text } = movie;
        const translation = await tranlateLine(text, language)
        movie.text = translation;
        collection.push(movie);
        console.log(`${Math.floor((ind / data.length) * 100)}%`)
        return collection;
    }, Promise.resolve([]));
    return translatedMovie;
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
const handleTranslation = async (filename, language) => {
    try {
        const data = getSubtitle(filename);
        const totalCharacters = data.reduce((total, movie) => {
            const { text } = movie;
            total += text.split('').length;
            return total;
        }, 0);
        console.log(totalCharacters, '[TOTAL CHARACTERS]')
        const translated = await translateMovie(data, language)
        console.log('AWAIT TRANSLATED OVER', translated)
        saveTranslation(translated, filename, language);
    } catch (err) {
        console.log(err)
        return false;
    }

}
console.log(process.argv);
handleTranslation(process.argv[2], process.argv[3]);