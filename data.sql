\c messagely
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS messages;

CREATE TABLE users (
    username text PRIMARY KEY,
    password text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text NOT NULL,
    join_at timestamp without time zone NOT NULL,
    last_login_at timestamp with time zone
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    from_username text NOT NULL REFERENCES users,
    to_username text NOT NULL REFERENCES users,
    body text NOT NULL,
    sent_at timestamp with time zone NOT NULL,
    read_at timestamp with time zone
);

-- Insert fake records into the users table
INSERT INTO users (username, password, first_name, last_name, phone, join_at)
VALUES 
  ('user1', 'password1', 'John', 'Doe', '+1234567890', NOW()),
  ('user2', 'password2', 'Jane', 'Smith', '+1987654321', NOW()),
  ('user3', 'password3', 'Alice', 'Johnson', '+1555555555', NOW());

-- Insert fake records into the messages table
INSERT INTO messages (from_username, to_username, body, sent_at)
VALUES 
  ('user1', 'user2', 'Hello, how are you?', NOW()),
  ('user2', 'user1', 'Im doing well, thank you!', NOW()),
  ('user3', 'user1', 'Hey there!', NOW());
