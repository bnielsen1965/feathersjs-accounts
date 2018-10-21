
var client;
var apiURL = window.location.href;
var group;


$(document).ready(function() {
  var socket = io(apiURL);
  client = feathers();
  client.configure(feathers.socketio(socket));
  client.configure(feathers.authentication());

  client.on('authenticated', () => {
  });

  $('button#login').click(function () { authenticate();	});
  $('#loginform, .input').keypress(function (e) {
    if (e.which === 13 && $('input#username').val().length && $('input#password').val().length) {
      authenticate();
      return false;
    }
  });

  $('button#createuser').click(function () { createUser(); });
  $('button#patchpassword').click(function () { patchPassword(); });
});


function authenticate() {
  showErrors();
  var auth ={
    strategy: 'local',
    username: $('input#username').val(),
    password: $('input#password').val()
  };
  client.authenticate(auth)
  .then(response => {
    group = response.group;
    authenticated();
  })
  .catch(err => {
    showErrors([err.message]);
  });
}


function authenticated() {
  // show restricted items included in user's group
  $('.restricted').each(function () {
    if ($(this).data('groups').split(' ').indexOf(group) !== -1) {
      $(this).removeClass('hidden');
    }
  });
  $('#login').addClass('hidden');
  $('#main').removeClass('hidden');

  if (group === 'admin') {
    getUserList();
  }
}


function getUserList() {
  findAll(client.service('users'))
  .then(docs => {
    $('#userlist').html('');
    $('#userlist').append('<tr><th>Username</th><th>Group</th><th></th></tr>');
    docs.forEach(doc => {
      $('#userlist').append(
        '<tr><td>' + doc.username + '</td>' +
        '<td>' + doc.group + '</td>' +
        '<td><button onclick="deleteUser(\'' + doc.username + '\')">Delete</button></td></tr>');
    })
  })
  .catch(err => { showErrors([err.message]); });
}


async function findAll(service, query, skip) {
  query = query || {};
  skip = skip || 0;
  let response = await service.find({ query: query, $skip: skip });
  if (response.total > response.data.length + response.data.skip) {
    return response.data.concat(await findAll(service, query, response.skip + response.limit));
  }
  else {
    return response.data;
  }
}


function createUser() {
  var user = {
    username: $('input#createusername').val(),
    group: $('select#creategroup').val()
  };
  user.password = $('input#createpassword').val();
  client.service('users').create(user)
  .then(doc => {
    getUserList();
  })
  .catch(err => {	showErrors([err.toString()]);	});
}


function deleteUser(username) {
  client.service('users').remove(null, { query: { username: username } })
  .then(doc => {
    getUserList();
  })
  .catch(err => { showErrors([err.message]); });
}


function patchPassword() {
  var patch = {
    password: $('input#changepassword').val()
  };
  client.service('users').patch(null, patch)
  .then(doc => {
    $('#data').append('Changed password ' + '<br>\n');
  })
  .catch(err => {
    showErrors([err.message]);
  });
}


// display the query progress
function progress(current, total) {
  $('#progress').html(Math.round(current / total * 100) + '%')
}

// show error messages
function showErrors(errors) {
  errors = errors || [];
  $('#errors').html('');
  errors.forEach(function (error) {
    $('#errors').append(error + '<br>');
  });
}
