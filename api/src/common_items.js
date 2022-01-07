// variables, functions, enums, etc. that are used elsewhere in the code

// ---------------- escape functions ---------------
// (NOT USED) known issue - a name like O'Reilly will be destroyed
function clean_input_all(string) {
    // ' " \ / < > ` &
    string = string.replaceAll(/['\"\\/<>&`]/ig, '');
    string = string.trim()
    return string;
}

// (NOT USED) not sure where this is used but it's defined in v1.0
function clean_input_keepslash(string) {
    // ' " \ < > ` &
    string = string.replaceAll(/['\"\\<>&`]/ig, '');
    string = string.trim();
    return string;
}

// 🌍      👨🏻‍🚀              🔫👨🏽‍🚀
// wait its all urls?  always has been
// @see https://knowyourmeme.com/memes/wait-its-all-ohio-always-has-been
function clean_input_encodeurl(string) {
    //string = string.replaceAll(/[']/ig, '%27');
    string = encodeURIComponent(string);
    return string;
}
// -------------------------------------------------

// ---------------- unescape objects ---------------
function unescape_object(obj) {
    for (let key in obj) {
        // javascript is a perfect language with no flaws
        if (obj.hasOwnProperty(key) && obj[key] && typeof(obj[key]) === 'string') {
            //obj[key] = obj[key].replaceAll(/[%27]/ig, "'");
            obj[key] = decodeURIComponent(obj[key]);
        }
    }

    return obj;
}
// -------------------------------------------------

// -------------- fiscal year globals -------------
// modify these numbers annually
const current_fiscal_year = "2017-2018";
const first_fiscal_year = "2015-2016";
// -------------------------------------------------

// ---------------- committee lut ------------------
// this is the best solution I can come up with
//  with out a database schema migration. Here is the problem:
//  the committee column in the database is an enum with some values,
//  but the name of the committee does not match the enum value.
//  Further, the name of the committee is not a http safe thing to put in a URL.
//  Therefore, this is a lookup table of sorts to cross reference these
//  three different names for THE SAME COMMITEE
// format = { http-name: [ db enum, committee name ] }
const committee_lut =
{
    'general':['General IEEE', 'General IEEE'],
    'aerial':['Aerial Robotics', 'Aerial Robotics'],
    'csociety':['Computer Society', 'Computer Society'],
    'embs':['EMBS', 'EMBS'],
    'ge':['GE', 'Growth & Engagement'],
    'mtt-s':['MTT-S', 'MTT-S'],
    'professional':['Professional', 'Industrial Relations'],
    'learning':['Learning', 'Learning'],
    'racing':['Racing', 'Racing'],
    'rov':['ROV', 'ROV'],
    'social':['Social', 'Social'],
    'soga':['SOGA', 'SOGA'],
};
// mini-LUT for db enum : committee name
const committee_name_swap =
{
    'General IEEE':'General IEEE',
    'Aerial Robotics':'Aerial Robotics',
    'Computer Society':'Computer Society',
    'EMBS':'EMBS',
    'GE':'Growth & Engagement',
    'MTT-S':'MTT-S',
    'Professional':'Industrial Relations',
    'Learning':'Learning',
    'ROV':'ROV',
    'Social':'Social',
    'SOGA':'SOGA',
}
// -------------------------------------------------

// --------------- access level enum ---------------
// *sigh* enums don't exist in js so this is the best approximation
// Going by 2 so that values can be added in between without needing to change the database.
const ACCESS_LEVEL = Object.freeze({
    "member":0,
    "internal_leader":2,
    "officer":4,
    "treasurer":6,
});
// -------------------------------------------------

export {
    clean_input_all,
    clean_input_keepslash,
    clean_input_encodeurl,
    unescape_object,
    current_fiscal_year,
    first_fiscal_year,
    committee_lut,
    committee_name_swap,
    ACCESS_LEVEL
}
