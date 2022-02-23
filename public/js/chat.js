
/**
 * elements
 * 
 * convention is to prefix variable names with $ when they reference dom
 * elements
 */
const $messageForm = document.querySelector('form#message-form');
const $messageFormInput = document.querySelector('input');
const $messageFormBtn = document.querySelector('form button');
const $sendLocationBtn = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');
// templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;



// options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });



/**
 * adding the script tag:
 * <script src="/socket.io/socket.io.js"></script>
 * to the client html exposes a global io function. all that is needed is to
 * call io() and the server and clients automatically connect through some type
 * of sorcery
 * 
 */
const socket = io();



/**
 * listener for server messages. usually messages from other chat clients
 * 
 * socket.on listens for events from the server
 * socket.emit sends data to server
 * 
 */
socket.on('serverMessage', (message) => {

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});



socket.on('locationMessage', (mapObj) => {

    const html = Mustache.render(locationTemplate, {
        username: mapObj.username,
        attr: `href="${mapObj.url}" target="_blank"`,
        createdAt: moment(mapObj.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});



socket.on('roomData', ({ room, users }) => {

    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    $sidebar.innerHTML = html;
});



/**
 * listens for submit event on form messageForm
 * 
 * socket.emit takes a function as final argument (optional) and is called with
 * the server answer; that is, the emit data was acknowledged by the server. it
 * is used as a callback on the server api socket.on. this could be used for
 * any number of things like validation
 */
$messageForm.addEventListener('submit', function (e) {
    // prevents the default action
    e.preventDefault();

    // disable button until message status to prevent double-clicks etc
    $messageFormBtn.setAttribute('disabled', 'disabled');

    // can use the event object to get the input field value
    socket.emit('clientMessage', `${e.target.elements.message.value}`, (error, serverStatus) => {
        // remove disabled attritube to re-enable send button
        $messageFormBtn.removeAttribute('disabled');
        // clear text input (also this.reset)
        $messageFormInput.value = '';
        // move cursor position to text input
        $messageFormInput.focus();

        if (error) {
            return console.log('message sent to server < > message blocked by server <', error);
        }
        console.log('message sent to server <', serverStatus);
    });
});



// listens for click event on send-location button
$sendLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('geolocation is not supported by your browser');
    }

    // disable send geolocation button
    $sendLocationBtn.setAttribute('disabled', 'disabled');

    // use navigator api to get geolocation data
    navigator.geolocation.getCurrentPosition((position) => {
        // remove disable attribut to re-enable location button
        $sendLocationBtn.removeAttribute('disabled');

        const positionObj = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        socket.emit('locationData', positionObj, (error, serverStatus) => {
            if (error) {
                return console.log('location sent to server < > there was an error <', error);
            }
            console.log('location sent to server <', serverStatus);
        });
    });
});



// send joining user data to server
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});



const autoscroll = () => {

    // get new message element (last child element in messages)
    const $newMessage = $messages.lastElementChild;
    // get styles for new message to calculate bottom margin spacing
    const newMessageStyles = getComputedStyle($newMessage);
    // get numeric margin value from marginBottom style on new message
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    // get height of new message
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
    // get visible height of messages element
    const visibleHeight = $messages.offsetHeight;
    // get total height of messages container from scrollheight property
    const containerHeight = $messages.scrollHeight;
    // get distance from top (where now in messages container)
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};