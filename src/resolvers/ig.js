const { get, post } = require("axios");
const FormData = require('form-data');
const axios = require('axios');
const { parseSignedRequest } = require('../helpers');
require("dotenv").config();

async function getShortLivedAccessToken(authCode) {
    try {
        const formData = new FormData();
        formData.append('client_id',process.env.INSTAGRAM_APP_ID)
        formData.append('client_secret',process.env.INSTAGRAM_APP_SECRET)
        formData.append('redirect_uri',`${process.env.BASEURL}/auth/oauth`)
        formData.append('code',authCode)
        formData.append('grant_type',"authorization_code")
        const shortTermReq = await axios({
          url: 'https://api.instagram.com/oauth/access_token',
          method: 'post',
          data: formData,
          headers: formData.getHeaders(),
        });
        return shortTermReq.data.access_token
    }catch(err){
        console.log(err);
    }
}

async function getLongLivedAccessToken(shortLivedToken) {
    try {
        const endpoint = "https://graph.instagram.com/access_token"
        const longTermReq = await axios.get(`${endpoint}?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortLivedToken}`);
        const {user_id,expires_in,access_token} = longTermReq.data;
        return {
            user_id,
            expires_in,
            long_term_token: access_token
        }
    }catch(err){
        console.log(err);
    }
}

async function handleDeauthorization(req){

}

module.exports = {
    getShortLivedAccessToken,
    getLongLivedAccessToken,
    handleDeauthorization
}