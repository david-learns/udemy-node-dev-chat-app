
// all users logged in to chat app
const users = [];



const addUser = ({ id, username, room }) => {

    // clean data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    // validate data
    if (!username || !room) {
        return {
            error: 'username and room are required'
        }
    }

    // check for existing username
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username;
    });

    // validate username
    if (existingUser || username === 'admin') {
        return {
            error: 'username already in use'
        }
    }

    // store user
    const user = { id, username, room };
    users.push(user);
    return { user }
};



const removeUser = (id) => {

    const index = users.findIndex((user) => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0]
    }
};



const getUser = (id) => {

    return users.find((user) => user.id === id);
};



const getUsersInRoom = (room) => {

    return users.filter((user) => user.room === room);
}



module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
}