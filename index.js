'use strict';

// Messenger API integration example
// We assume you have:
// * a Wit.ai bot setup (https://wit.ai/docs/quickstart)
// * a Messenger Platform setup (https://developers.facebook.com/docs/messenger-platform/quickstart)
// You need to `npm install` the following dependencies: body-parser, express, request.
//
// 1. npm install body-parser express request
// 2. Download and install ngrok from https://ngrok.com/download
// 3. ./ngrok http 8445
// 4. WIT_TOKEN=your_access_token FB_APP_SECRET=your_app_secret FB_PAGE_TOKEN=your_page_token node examples/messenger.js
// 5. Subscribe your page to the Webhooks using verify_token and `https://<your_ngrok_io>/webhook` as callback URL.
// 6. Talk to your bot on Messenger!

const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const fetch = require('node-fetch');
const request = require('request');

const sleep = require('sleep');
const moment = require('moment-timezone');

let Wit = null;
let log = null;
try {
  // if running from repo
  Wit = require('../').Wit;
  log = require('../').log;
} catch (e) {
  Wit = require('node-wit').Wit;
  log = require('node-wit').log;
}

// Webserver parameter
const PORT = process.env.PORT || 8445;

// Wit.ai parameters
const WIT_TOKEN = process.env.WIT_TOKEN;

// Messenger API parameters
const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
if (!FB_PAGE_TOKEN) { throw new Error('missing FB_PAGE_TOKEN') }
const FB_APP_SECRET = process.env.FB_APP_SECRET;
if (!FB_APP_SECRET) { throw new Error('missing FB_APP_SECRET') }

const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
if (!FB_VERIFY_TOKEN) { throw new Error('missing FB_VERIFY_TOKEN') }
                                        
// ----------------------------------------------------------------------------
// Messenger API specific code

// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference

const fbMessage = (id, text) => {
  const body = JSON.stringify({
    recipient: { id },
    message: { text },
  });
  const qs = 'access_token=' + encodeURIComponent(FB_PAGE_TOKEN);
  return fetch('https://graph.facebook.com/me/messages?' + qs, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
  })
  .then(rsp => rsp.json())
  .then(json => {
    if (json.error && json.error.message) {
      throw new Error(json.error.message);
    }
    //console.log(json);
    return json;
  });
};

// Custom Code

const fbRichMessage = (id, json) => {
  var recipient = '"recipient":{"id":"' + id + '"},'; 
  var body = "{" + recipient + json + "}";
  //console.log(body + '\n' + recipient);
  const qs = 'access_token=' + encodeURIComponent(FB_PAGE_TOKEN);
  return fetch('https://graph.facebook.com/me/messages?' + qs, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
  })
  .then(rsp => rsp.json())
  .then(responseJson => {
    if (json.error && json.error.message) {
      throw new Error(json.error.message);
    }
    //console.log(responseJson);
    return responseJson;
  });
};

// ----------------------------------------------------------------------------
// Wit.ai bot specific code

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = {fbid: fbid, context: {}};
  }
  return sessionId;
};

// Our bot actions
const actions = {
  send({sessionId}, {text}) {
    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to
    const recipientId = sessions[sessionId].fbid;
    console.log('Sup: ', recipientId);
    if (recipientId) {
      // Yay, we found our recipient!
      // Let's forward our bot response to her.
      // We return a promise to let our bot know when we're done sending
      return fbMessage(recipientId, text)
      .then(() => null)
      .catch((err) => {
        console.error(
          'Oops! An error occurred while forwarding the response to',
          recipientId,
          ':',
          err.stack || err
        );
      });
    } else {
      console.error('Oops! Couldn\'t find user for session:', sessionId);
      // Giving the wheel back to our bot
      return Promise.resolve()
    }
  },
  // You should implement your custom actions here
  // See https://wit.ai/docs/quickstart
    
  // MY CUSTOM CODE
    
  // Welcome Card
  Welcome(text) {
    console.log('Welcome Card');
    var recipientId = sessions[text.sessionId].fbid;
    var text = '"message":{"attachment":{"type":"template","payload":{"template_type":"generic","elements":[{"title":"Art of Yoga - A Boutique Yoga Studio in Singapore\'s East Coast ","image_url":"https://artofyoga.sg/wp-content/uploads/2017/02/AoY-Fullsize-0294.jpg","subtitle":"We offer a variety of yoga classes including Ashtanga, Hatha, Pre-Natal and more","default_action": {"type": "web_url","url": "https://www.instagram.com/p/rYlPzKtOqJ/","messenger_extensions": true,"webview_height_ratio": "tall","fallback_url": "https://www.instagram.com/artofyogasg/"},"buttons":[{"type":"web_url","url":"https://artofyoga.sg","title":"AoY Website"}]}]}}}';
    fbRichMessage(recipientId, text);
  },

  // Welcome Text Messages. Have to put them in seperate Functions or they may not send in right order.
  WelcomeTextA(text) {
    console.log('Welcome Text 1');
    var recipientId = sessions[text.sessionId].fbid;
    var text = '"message":{"text":"Hi! I\'m Henrik - Art of Yoga\'s experimental AI powered chatbot!"}';         
    sleep.sleep(2);
    fbRichMessage(recipientId, text);  
  },

  WelcomeTextB(text) {
    console.log('Welcome Text 2');
    var recipientId = sessions[text.sessionId].fbid;   
    var text = '"message":{"text":"I can help you with a variety of things from booking a class to providing you with info about class schedules, how to get to our studio and more! "}';
    sleep.sleep(2);
    fbRichMessage(recipientId, text);  
  },

  WelcomeTextC(text) {
    console.log('Welcome Text 3');
    var recipientId = sessions[text.sessionId].fbid;    
    var text = '"message":{"text":"Ask me a question or type \'navigation\' to see what I can do! If you need help at any time, just type \'help\'."}';
    sleep.sleep(2);
    fbRichMessage(recipientId, text);  
  },

  // Contact Us / Directions
  Directions(text) {
    console.log('Directions Card');
    var recipientId = sessions[text.sessionId].fbid;
    var text = '"message":{"attachment":{"type":"template","payload":{"template_type":"generic","elements":[{"title":"Art of Yoga - Contact Us / Directions","image_url":"https://artofyoga.sg/wp-content/uploads/2015/11/1.jpg","subtitle":"121 Upper East Coast Road, #02-01","default_action": {"type": "web_url","url": "https://artofyoga.sg","messenger_extensions": true,"webview_height_ratio": "tall","fallback_url": "https://artofyoga.sg"},"buttons":[{"type":"web_url","url":"https://artofyoga.sg/contact/","title":"Contact"},{"type":"web_url","url":"https://www.google.com/maps/place/Art+of+Yoga/@1.3135891,103.9294062,15z/data=!4m5!3m4!1s0x0:0x15092c1c80eb83bb!8m2!3d1.3135891!4d103.9294062","title":"Directions"}]}]}}}';
    fbRichMessage(recipientId, text);
  },
    
  // Operating Hours
  OperatingHours(text) {
    console.log('Operating Hours Card');
    
    //console.log(moment().tz("Asia/Singapore").format());  
    
    // Sets Day, Hour, Minute & open 
    var day = moment().tz("Asia/Singapore").weekday();  
    var hour = moment().tz("Asia/Singapore").hour();
    var minute = moment().tz("Asia/Singapore").minute();
 
    // Logic to Test if Open or Closed.
    //console.log(hour,day);
    if ((day >= 0 && day <= 5) && (hour >= 6 && hour <= 21)) {
        var isOpen = true; 
    } else if ((day >= 6 && day <= 7) && ((hour >= 8 && hour <= 17) || (hour === 7 && minute >= 30))) {
        var isOpen = true; 
    } else {
        var isOpen = false;
    }
    if (isOpen === true) {var open = 'Currently Open'; } else {var open = 'Currently Closed'; }
    //console.log(open);
      
    var recipientId = sessions[text.sessionId].fbid;
    var text = '"message":{"attachment":{"type":"template","payload":{"template_type":"generic","elements":[{"title":"Art of Yoga - Operating Hours","image_url":"https://artofyoga.sg/wp-content/uploads/2015/11/16998817_1090435211063008_2620425424784904845_n.jpg","subtitle":"Monday - Friday: 6am - 9pm \\nSaturday & Sunday: 7:30am - 5pm \\n' + open + '","default_action": {"type": "web_url","url": "https://artofyoga.sg","messenger_extensions": true,"webview_height_ratio": "tall","fallback_url": "https://artofyoga.sg"}}]}}}';
    fbRichMessage(recipientId, text);

  },
    
  // Navigation Card
  Navigation(text) {
    console.log('Navigation Card');
    var recipientId = sessions[text.sessionId].fbid;
    var text = '"message":{"text":"Choose an option below or type \'help\' if you need assistance at any time. Here is a list of things I can help you with:","quick_replies":[{"content_type":"text","title":"Contact us","payload":"Contact us"},{"content_type":"text","title":"Classes","payload":"Classes"},{"content_type":"text","title":"Booking","payload":"Booking"},{"content_type":"text","title":"Directions","payload":"Directions"},{"content_type":"text","title":"Opening Hours","payload":"Opening Hours"},{"content_type":"text","title":"Teachers","payload":"Teachers"},{"content_type":"text","title":"Parking","payload":"Parking"},{"content_type":"text","title":"Public Transport","payload":"Public Transport"},{"content_type":"text","title":"Help","payload":"Help"},{"content_type":"text","title":"Live Chat","payload":"Live Chat"}]}';
    fbRichMessage(recipientId, text);
  },

  // Help Cards
  HelpA(text) {
    console.log('Help Text 1');
    var recipientId = sessions[text.sessionId].fbid;
    var text = '"message":{"text":"I am an AI chat bot designed to assist you with a variety of tasks from booking a class to giving you directions and more."}';
    fbRichMessage(recipientId, text);
  },
    
  HelpB(text) {
    console.log('Help Text 2');
    var recipientId = sessions[text.sessionId].fbid;
    var text = '"message":{"text":"You can ask me a question like \'what kind of classes do you offer\' or \'how do I get to the studio\'."}';
    sleep.sleep(2);
    fbRichMessage(recipientId, text);
  },

  HelpC(text) {
    console.log('Help Text 3');
    var recipientId = sessions[text.sessionId].fbid;
    var text = '"message":{"text":"I can also put you in touch with a human operator if you type \'Human\'. Try it out!"}';
    sleep.sleep(2);
    fbRichMessage(recipientId, text);
  },

  // Ok
  Ok(text) {
    console.log('Ok Card');
    var recipientId = sessions[text.sessionId].fbid;
    var text = '"message":{"text":"Let me know if there\'s something else I can help you with!"}';
    sleep.sleep(3);
    fbRichMessage(recipientId, text);
  },

  // Typing
  Typing(text) {
    console.log('Typing Card');
    var recipientId = sessions[text.sessionId].fbid;
    var text = '"sender_action":"typing_on"';
    fbRichMessage(recipientId, text);
  },
    
    
};

// Setting up our bot
const wit = new Wit({
  accessToken: WIT_TOKEN,
  actions,
  logger: new log.Logger(log.INFO)
});

// Starting our webserver and putting it all together
const app = express();
app.use(({method, url}, rsp, next) => {
  rsp.on('finish', () => {
    console.log(`${rsp.statusCode} ${method} ${url}`);
  });
  next();
});
app.use(bodyParser.json({ verify: verifyRequestSignature }));

// Webhook setup
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === FB_VERIFY_TOKEN)   {
      res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});



// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// Message handler
app.post('/webhook', (req, res) => {
  // Parse the Messenger payload
  // See the Webhook reference
  // https://developers.facebook.com/docs/messenger-platform/webhook-reference
  const data = req.body;

  if (data.object === 'page') {
    data.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message && !event.message.is_echo) {
          // Yay! We got a new message!
          // We retrieve the Facebook user ID of the sender
          const sender = event.sender.id;

          // We retrieve the user's current session, or create one if it doesn't exist
          // This is needed for our bot to figure out the conversation history
          const sessionId = findOrCreateSession(sender);

          // We retrieve the message content
          const {text, attachments} = event.message;

          if (attachments) {
            // We received an attachment
            // Let's reply with an automatic message
            fbMessage(sender, 'Sorry I can only process text messages for now.')
            .catch(console.error);
          } else if (text) {
            // We received a text message

            // Let's forward the message to the Wit.ai Bot Engine
            // This will run all actions until our bot has nothing left to do
            wit.runActions(
              sessionId, // the user's current session
              text, // the user's message
              sessions[sessionId].context // the user's current session state
            ).then((context) => {
              // Our bot did everything it has to do.
              // Now it's waiting for further messages to proceed.
              console.log('Waiting for next user messages');

              // Based on the session state, you might want to reset the session.
              // This depends heavily on the business logic of your bot.
              // Example:
              // if (context['done']) {
              //   delete sessions[sessionId];
              // }

              // Updating the user's current session state
              sessions[sessionId].context = context;
            })
            .catch((err) => {
              console.error('Oops! Got an error from Wit: ', err.stack || err);
            })
          }
        } else {
          console.log('received event', JSON.stringify(event));
        }
      });
    });
  }
  res.sendStatus(200);
});

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', FB_APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

app.listen(PORT);
console.log('Listening on :' + PORT + '...');