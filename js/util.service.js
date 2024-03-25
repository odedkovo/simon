
const gCompliments =
    ['מַדְהִים', 'מְשַׁגֵּעַ', 'מַטְרִיף', 'מְעַלֵּף', 'מְהַמֵּם', 'קְרֶיְיזִי', 'מַגְנִיב', ' מַקְסִים', 'חָמוּד']
const gCheers =
    ['וּוָאו אֵין מִלִּים', 'מֹחַ חַד כָּזֶה לֹא רָאִיתִי', 'פְּשְׁשש בָּאָה לְפֹה הַרְבֵּה?', 'יֵשׁ לְךָ כִּשָּׁרוֹן!', 'כָּאַב כְּשֶׁנָּפַלְת מִגַּן עֵדֶן?', 'כִּשָּׁרוֹן מְבֻזְבָּז', 'וּוָאו זֶה טִבְעִי?']


function getRandomIntInclusive(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function getCompliment() {
    return gCompliments[getRandomIntInclusive(0, gCompliments.length - 1)]
}
function getCheer() {
    return gCheers[getRandomIntInclusive(0, gCheers.length - 1)]
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'
    var color = '#'
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
    }
    return color
}
