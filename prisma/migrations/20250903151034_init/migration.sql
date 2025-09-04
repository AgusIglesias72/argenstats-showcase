-- CreateTable
CREATE TABLE "public"."indicators" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "source" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."indicator_values" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "variation" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicator_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emae" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "original_value" DOUBLE PRECISION NOT NULL,
    "seasonally_adjusted_value" DOUBLE PRECISION NOT NULL,
    "cycle_trend_value" DOUBLE PRECISION NOT NULL,
    "monthly_variation" DOUBLE PRECISION,
    "yearly_variation" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emae_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emae_by_activity" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "economy_sector" TEXT NOT NULL,
    "economy_sector_code" TEXT NOT NULL,
    "original_value" DOUBLE PRECISION NOT NULL,
    "monthly_variation" DOUBLE PRECISION,
    "yearly_variation" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emae_by_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ipc" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "component" TEXT NOT NULL,
    "component_code" TEXT NOT NULL,
    "component_type" TEXT NOT NULL DEFAULT 'RUBRO',
    "index_value" DOUBLE PRECISION NOT NULL,
    "monthly_pct_change" DOUBLE PRECISION,
    "yearly_pct_change" DOUBLE PRECISION,
    "accumulated_pct_change" DOUBLE PRECISION,
    "region" TEXT NOT NULL DEFAULT 'Nacional',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ipc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cron_executions" (
    "id" TEXT NOT NULL,
    "task_name" TEXT NOT NULL,
    "execution_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "error_details" TEXT,
    "records_processed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cron_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dashboard_widgets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "position" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "indicators_slug_key" ON "public"."indicators"("slug");

-- CreateIndex
CREATE INDEX "indicators_slug_idx" ON "public"."indicators"("slug");

-- CreateIndex
CREATE INDEX "indicator_values_date_idx" ON "public"."indicator_values"("date");

-- CreateIndex
CREATE UNIQUE INDEX "indicator_values_indicatorId_date_key" ON "public"."indicator_values"("indicatorId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "emae_date_key" ON "public"."emae"("date");

-- CreateIndex
CREATE INDEX "emae_date_idx" ON "public"."emae"("date");

-- CreateIndex
CREATE INDEX "emae_by_activity_date_economy_sector_code_idx" ON "public"."emae_by_activity"("date", "economy_sector_code");

-- CreateIndex
CREATE UNIQUE INDEX "emae_by_activity_date_economy_sector_code_key" ON "public"."emae_by_activity"("date", "economy_sector_code");

-- CreateIndex
CREATE INDEX "ipc_date_region_idx" ON "public"."ipc"("date", "region");

-- CreateIndex
CREATE INDEX "ipc_component_code_idx" ON "public"."ipc"("component_code");

-- CreateIndex
CREATE UNIQUE INDEX "ipc_date_component_code_region_key" ON "public"."ipc"("date", "component_code", "region");

-- CreateIndex
CREATE INDEX "cron_executions_task_name_execution_time_idx" ON "public"."cron_executions"("task_name", "execution_time");

-- CreateIndex
CREATE INDEX "dashboard_widgets_user_id_idx" ON "public"."dashboard_widgets"("user_id");

-- AddForeignKey
ALTER TABLE "public"."indicator_values" ADD CONSTRAINT "indicator_values_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "public"."indicators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emae_by_activity" ADD CONSTRAINT "emae_by_activity_date_fkey" FOREIGN KEY ("date") REFERENCES "public"."emae"("date") ON DELETE RESTRICT ON UPDATE CASCADE;
