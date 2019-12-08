# GET /api/v1/groups/names/:name

```json
{
	"status":"success",
	"data":{
		"groups":[
			{
				"id":"40cbb5a9-4744-4a25-90bb-7f8ee5a10df4",
				"name":"Cute",
				"description":null,
				"image":"/images/original/missing.png",
				"is_list":false,
				"members_count":2,
				"rank":{
					"id":"66248e70-1781-4a93-bed8-67782be33734","name":"owner"
				}
			}
		]
	}
}
```

# GET /api/v1/groups/:id/ranks

```json
{
	"status":"success",
	"data":{
		"groups":{
			"40cbb5a9-4744-4a25-90bb-7f8ee5a10df4":{ 
				"ranks":[
					{
						"id":"66248e70-1781-4a93-bed8-67782be33734",
						"name":"owner",
						"members_count":1,
						"permissions":{
							"edit_group":true,
							"edit_rank":true,
							"edit_member":true,
							"list_members":true,
							"list_ranks":true,
							"list_permissions":true,
							"query_member":true,
							"custom_1":false,
							"custom_2":false,
							"custom_3":false,
							"custom_4":false
						}
					}
				]
			}
		}
	}
}
```

# POST /api/v1/groups/members/Maki

{
    "groups": [
        "40cbb5a9-4744-4a25-90bb-7f8ee5a10df4"
    ]
}

```json
{
	"status":"success",
	"current_page":1,
	"total_pages":1,
	"per_page":30,
	"total_entries":1,
	"data":{
		"username":"Maki",
		"groups":{
			"40cbb5a9-4744-4a25-90bb-7f8ee5a10df4":{
				"group_name":"Cute",
				"username":"Maki",
				"rank":{
					"id":"66248e70-1781-4a93-bed8-67782be33734","name":"owner"
				}
			}
		}
	}
}
```