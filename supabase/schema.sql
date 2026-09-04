-- Enable pgvector extension
create extension if not exists vector;

-- Ta bort eventuell tidigare tabell för att säkerställa 384 dimensioner
drop table if exists manifest_chunks cascade;

-- Manifest chunks table for RAG
-- OBS: 384 dimensioner (paraphrase-multilingual-MiniLM-L12-v2)
create table manifest_chunks (
  id bigserial primary key,
  party_id text not null,
  content text not null,
  embedding vector(384),
  source_section text default 'Okänt avsnitt',
  page_number int default 0,
  created_at timestamptz default now()
);

-- Index for fast cosine similarity search
create index manifest_chunks_embedding_idx
  on manifest_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index for filtering by party
create index manifest_chunks_party_idx
  on manifest_chunks (party_id);

-- Semantic search function
create or replace function match_manifest_chunks(
  query_embedding vector(384),
  match_party_id text,
  match_count int default 5,
  match_threshold float default 0.3
)
returns table (
  id bigint,
  party_id text,
  content text,
  source_section text,
  page_number int,
  similarity float
)
language sql stable
as $$
  select
    mc.id,
    mc.party_id,
    mc.content,
    mc.source_section,
    mc.page_number,
    1 - (mc.embedding <=> query_embedding) as similarity
  from manifest_chunks mc
  where
    mc.party_id = match_party_id
    and 1 - (mc.embedding <=> query_embedding) > match_threshold
  order by mc.embedding <=> query_embedding
  limit match_count;
$$;
