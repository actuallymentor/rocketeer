DECLARE latest_usage_day DATE DEFAULT (
  SELECT MAX( DATE( usage_start_time ) )
  FROM __DETAILED_TABLE__
  WHERE project.id = 'rocketeer-nft'
);

ASSERT latest_usage_day >= DATE '2026-08-25'
  AS 'Cloud Billing export has not loaded through 2026-08-25';

CREATE OR REPLACE TABLE `rocketeer-nft.cloud_billing_export.storage_cost_verification` AS
WITH dates AS (
  SELECT day, 'pre' AS period
  FROM UNNEST( GENERATE_DATE_ARRAY( DATE '2026-08-12', DATE '2026-08-14' ) ) AS day

  UNION ALL

  SELECT day, 'post' AS period
  FROM UNNEST( GENERATE_DATE_ARRAY( DATE '2026-08-23', DATE '2026-08-25' ) ) AS day
),
targets AS (
  SELECT 'project_storage' AS target, CAST( NULL AS STRING ) AS bucket

  UNION ALL

  SELECT 'app_bucket', 'rocketeer-nft.appspot.com'

  UNION ALL

  SELECT 'legacy_artifact_bucket', 'us.artifacts.rocketeer-nft.appspot.com'
),
daily_cost AS (
  SELECT
    target,
    DATE( usage_start_time ) AS day,
    SUM( CAST( cost AS NUMERIC ) )
      + SUM( IFNULL( (
          SELECT SUM( CAST( credit.amount AS NUMERIC ) )
          FROM UNNEST( credits ) AS credit
        ), 0 ) ) AS net_cost
  FROM __DETAILED_TABLE__
  CROSS JOIN targets
  WHERE DATE( usage_start_time ) BETWEEN DATE '2026-08-12' AND DATE '2026-08-25'
    AND project.id = 'rocketeer-nft'
    AND service.description = 'Cloud Storage'
    AND ( bucket IS NULL OR ENDS_WITH( resource.global_name, CONCAT( '/buckets/', bucket ) ) )
  GROUP BY target, day
),
complete_days AS (
  SELECT target, period, day, COALESCE( net_cost, 0 ) AS net_cost
  FROM targets
  CROSS JOIN dates
  LEFT JOIN daily_cost USING( target, day )
)
SELECT
  CURRENT_TIMESTAMP() AS generated_at,
  latest_usage_day,
  target,
  period,
  COUNT(*) AS complete_days,
  SUM( net_cost ) AS net_cost,
  AVG( net_cost ) AS average_daily_net_cost
FROM complete_days
GROUP BY target, period
ORDER BY target, period;

ASSERT COALESCE( (
  SELECT average_daily_net_cost = 0
  FROM `rocketeer-nft.cloud_billing_export.storage_cost_verification`
  WHERE target = 'legacy_artifact_bucket' AND period = 'post'
), FALSE ) AS 'Legacy artifact bucket still has post-expiry cost';

SELECT *
FROM `rocketeer-nft.cloud_billing_export.storage_cost_verification`
ORDER BY target, period;
