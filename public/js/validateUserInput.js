/**
 * Created by linh on 08/01/2015.
 */
function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validatePassword(pwd){
    /*
     This regex will enforce these rules:
     At least one upper case english letter
     At least one lower case english letter
     At least one digit
     At least one special character
     Minimum 8 in length
     */
    return /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/.test(pwd);
}

function validateDate(date){
    //This code will validate date format DD/MM/YY
    //return /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{2}$/.test(date);


    //This is working for me for MM/dd/yyyy.
    return /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/.test(date);
}