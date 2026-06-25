-- Fix existing meeting_rooms data with lowercase status values
-- Run this in MySQL Workbench or command line

USE `video-conferencing`;

-- Check current status values
SELECT DISTINCT status FROM meeting_rooms;

-- Update lowercase to uppercase
UPDATE meeting_rooms SET status = 'ACTIVE' WHERE status = 'active';
UPDATE meeting_rooms SET status = 'RUNNING' WHERE status = 'running';
UPDATE meeting_rooms SET status = 'EXPIRED' WHERE status = 'expired';
UPDATE meeting_rooms SET status = 'CLOSED' WHERE status = 'closed';

-- Verify the fix
SELECT DISTINCT status FROM meeting_rooms;

-- Expected output: ACTIVE, RUNNING, EXPIRED, CLOSED (all uppercase)
