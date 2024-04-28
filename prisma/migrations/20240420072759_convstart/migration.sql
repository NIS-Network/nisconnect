-- AlterTable
CREATE SEQUENCE conversation_id_seq;
ALTER TABLE "Conversation" ALTER COLUMN "id" SET DEFAULT nextval('conversation_id_seq');
ALTER SEQUENCE conversation_id_seq OWNED BY "Conversation"."id";
