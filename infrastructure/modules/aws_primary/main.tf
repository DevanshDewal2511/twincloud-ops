# TwinCloud Ops - AWS Primary Infrastructure Module (Concept / Production Model)

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# 1. VPC & Networking
resource "aws_vpc" "primary" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment_name}-aws-primary-vpc"
    Environment = "Primary"
    ManagedBy   = "TwinCloud-Ops-Terraform"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.primary.id

  tags = {
    Name = "${var.environment_name}-igw"
  }
}

resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = var.public_subnet_1_cidr
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment_name}-public-subnet-1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = var.public_subnet_2_cidr
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment_name}-public-subnet-2"
  }
}

# 2. Application Load Balancer
resource "aws_security_group" "alb_sg" {
  name        = "${var.environment_name}-alb-sg"
  description = "Allow inbound HTTP ingress"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "primary_alb" {
  name               = "${var.environment_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  tags = {
    Role = "Primary-ALB"
  }
}

resource "aws_lb_target_group" "primary_tg" {
  name        = "${var.environment_name}-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.primary.id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/health.json"
    interval            = 10
    timeout             = 3
    healthy_threshold   = 2
    unhealthy_threshold = 2
    matcher             = "200"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.primary_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary_tg.arn
  }
}

# 3. ECS Fargate Cluster & Service
resource "aws_ecs_cluster" "primary" {
  name = "${var.environment_name}-ecs-cluster"
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.environment_name}-app-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([
    {
      name      = "twincloud-aws-primary"
      image     = "nginx:alpine"
      essential = true
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "app" {
  name            = "${var.environment_name}-service"
  cluster         = aws_ecs_cluster.primary.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_1.id, aws_subnet.public_2.id]
    security_groups  = [aws_security_group.alb_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.primary_tg.arn
    container_name   = "twincloud-aws-primary"
    container_port   = 80
  }
}
