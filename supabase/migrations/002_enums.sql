-- ===========================================================================
-- 002 — טיפוסים חדשים והרחבת טיפוסים קיימים (איפיון v1.0, חבילה A1)
-- קובץ נפרד במכוון: ערך חדש ב-enum לא ניתן לשימוש באותה טרנזקציה שבה נוסף.
-- ===========================================================================

create type public.asset_type as enum
  ('apartment','penthouse','garden_apartment','house','office','shop','warehouse','industrial','land','parking','storage');
create type public.right_type as enum ('ownership','lease_rmi','housing_company');
create type public.identity_status as enum ('pending','submitted','verified','rejected');
create type public.ownership_status as enum ('pending','approved','rejected','needs_more');
create type public.account_type as enum ('owner','broker','ops');
create type public.document_kind as enum ('terms','privacy','brokerage_order','meeting_confirmation','closing_report');
create type public.notification_channel as enum ('email','sms');
create type public.notification_status as enum ('queued','sent','failed','cancelled');
create type public.review_decision as enum ('approved','rejected','needs_more');
create type public.scan_alert_status as enum ('new','reviewing','confirmed_bypass','false_positive','reported_closing');
create type public.exposure_level as enum ('neighborhood','full');

-- מצבי מעגל חדשים (§4.5)
alter type public.match_state add value if not exists 'meeting_confirmed';
alter type public.match_state add value if not exists 'in_negotiation';
alter type public.match_state add value if not exists 'closing';
alter type public.match_state add value if not exists 'swapped';
alter type public.match_state add value if not exists 'expired';

-- מצבי נכס חדשים (§4.2)
alter type public.listing_status add value if not exists 'pending_ownership';
alter type public.listing_status add value if not exists 'ownership_rejected';
alter type public.listing_status add value if not exists 'closing';
