#!/usr/bin/env python3
"""
AWS CDK Application for Snake Game Backend
"""

from aws_cdk import (
    Stack,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_rds as rds,
    aws_s3 as s3,
    aws_iam as iam,
    Duration,
    CfnOutput,
)
from constructs import Construct


class SnakeGameBackendStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC
        vpc = ec2.Vpc(
            self,
            "SnakeGameVpc",
            max_azs=2,
            cidr="10.0.0.0/16",
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="public", cidr_mask=24, subnet_type=ec2.SubnetType.PUBLIC
                ),
                ec2.SubnetConfiguration(
                    name="private",
                    cidr_mask=24,
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_NAT,
                ),
            ],
        )

        # Create ECS Cluster
        cluster = ecs.Cluster(self, "SnakeGameCluster", vpc=vpc)

        # Create RDS Database
        database = rds.DatabaseInstance(
            self,
            "SnakeGameDatabase",
            engine=rds.DatabaseInstanceEngine.POSTGRES,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO
            ),
            vpc=vpc,
            database_name="snake_game",
            deletion_protection=False,
            backup_retention=Duration.days(0),
            removal_policy=None,  # Set to DESTROY to allow stack deletion
        )

        # Create S3 Bucket for static assets (if needed)
        bucket = s3.Bucket(
            self,
            "SnakeGameBucket",
            versioned=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        )

        # Create ECS Task Definition for backend
        task_definition = ecs.FargateTaskDefinition(
            self, "SnakeGameTaskDefinition", memory_limit_mib=512, cpu=256
        )

        # Add backend container to task definition
        backend_container = task_definition.add_container(
            "BackendContainer",
            image=ecs.ContainerImage.from_asset("./backend"),
            environment={
                "DATABASE_URL": f"postgresql://admin:admin@{database.db_instance_endpoint.hostname}:{database.db_instance_endpoint.port}/snake_game"
            },
            logging=ecs.LogDriver.aws_logs(stream_prefix="snake-game-backend"),
        )

        # Add port mapping
        backend_container.add_port_mappings(
            ecs.PortMapping(container_port=8000, protocol=ecs.Protocol.TCP)
        )

        # Create Fargate Service
        service = ecs.FargateService(
            self,
            "SnakeGameService",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=1,
        )

        # Allow connections to database
        database.connections.allow_from(service, ec2.Port.tcp(5432))

        # Create load balancer
        load_balancer = elbv2.ApplicationLoadBalancer(
            self,
            "SnakeGameALB",
            vpc=vpc,
            internet_facing=True,
            load_balancer_name="snake-game-alb",
        )

        # Add listener
        listener = load_balancer.add_listener(
            "SnakeGameListener", port=80, protocol=elbv2.ApplicationProtocol.HTTP
        )

        # Add target group to listener
        target_group = listener.add_targets(
            "SnakeGameTargetGroup",
            port=8000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[service],
        )

        # Output URLs
        CfnOutput(
            self,
            "BackendApiUrl",
            value=f"http://{load_balancer.load_balancer_dns_name}",
            description="The URL of the Snake Game API",
        )

        CfnOutput(
            self,
            "DatabaseEndpoint",
            value=database.db_instance_endpoint.hostname,
            description="The database endpoint",
        )

        CfnOutput(
            self,
            "DatabasePort",
            value=str(database.db_instance_endpoint.port),
            description="The database port",
        )

        CfnOutput(
            self, "BucketUrl", value=bucket.bucket_url, description="The S3 bucket URL"
        )


# Create the stack
app = Stack()
SnakeGameBackendStack(app, "SnakeGameBackendStack")
