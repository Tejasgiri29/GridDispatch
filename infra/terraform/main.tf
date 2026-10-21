terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

# 1. Virtual Private Cloud (VPC)
resource "aws_vpc" "platform_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name        = "future-platforms-vpc"
    Environment = var.environment
  }
}

# 2. AWS RDS Multi-AZ PostgreSQL 16
resource "aws_db_instance" "agentguard_rds" {
  identifier          = "agentguard-db-prod"
  engine              = "postgres"
  engine_version      = "16.1"
  instance_class      = "db.r6g.xlarge"
  allocated_storage   = 100
  storage_type        = "gp3"
  multi_az            = true
  username            = "agentguard_master"
  password            = "vault_managed_rds_secret"
  skip_final_snapshot = true
  tags = {
    Name        = "agentguard-rds"
    Environment = var.environment
  }
}

# 3. AWS ElastiCache Redis Cluster
resource "aws_elasticache_cluster" "redis_cluster" {
  cluster_id           = "platforms-redis-cache"
  engine               = "redis"
  node_type            = "cache.r6g.large"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}

# 4. AWS MSK (Managed Streaming for Apache Kafka)
resource "aws_msk_cluster" "platform_kafka" {
  cluster_name           = "future-platforms-kafka"
  kafka_version          = "3.6.0"
  number_of_broker_nodes = 3

  broker_node_group_info {
    instance_type = "kafka.m5.xlarge"
    client_subnets = ["subnet-0123456789abcdef0", "subnet-0123456789abcdef1", "subnet-0123456789abcdef2"]
    security_groups = ["sg-0123456789abcdef0"]
  }
}
