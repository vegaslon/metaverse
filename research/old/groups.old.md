# GET /api/v1/groups/names/Cute
## Authentication

Reponse: 
```json
{
    "status": "success",
    "data": {
        "groups": [
            {
                "id": "40cbb5a9-4744-4a25-90bb-7f8ee5a10df4",
                "name": "Cute",
                "description": null,
                "image": "/images/original/missing.png",
                "is_list": false,
                "members_count": 1,
                "rank": {
                    "id": "66248e70-1781-4a93-bed8-67782be33734",
                    "name": "owner"
                }
            }
        ]
    }
}
```

# POST /api/v1/groups/names
## Authentication

Body:
- groupnames: ?

Reponse: 
```json
{
    "status": "success",
    "data": {
        "groups": []
    }
}
```

# GET /api/v1/groups/:id/ranks
## Authentication

Response:
```json
{
    "status": "success",
    "data": {
        "groups": {
            "40cbb5a9-4744-4a25-90bb-7f8ee5a10df4": { // group id
                "ranks": [
                    {
                        "id": "66248e70-1781-4a93-bed8-67782be33734", // rank id
                        "name": "owner",
                        "members_count": 1,
                        "permissions": {
                            "edit_group": true,
                            "edit_rank": true,
                            "edit_member": true,
                            "list_members": true,
                            "list_ranks": true,
                            "list_permissions": true,
                            "query_member": true,
                            "custom_1": false,
                            "custom_2": false,
                            "custom_3": false,
                            "custom_4": false
                        }
                    }
                ]
            }
        }
    }
}
```

# POST /api/v1/groups/:id/ranks
## Authentication

Body:
- utf8: ✓
- group_rank[name]: Test
- commit: Create New Rank

Response:
```json
{
    "status": "success",
    "data": {
        "groups": {
            "40cbb5a9-4744-4a25-90bb-7f8ee5a10df4": { // group id
                "ranks": [
                    {
                        "id": "66248e70-1781-4a93-bed8-67782be33734", // rank id
                        "name": "owner",
                        "members_count": 1,
                        "permissions": {
                            "edit_group": true,
                            "edit_rank": true,
                            "edit_member": true,
                            "list_members": true,
                            "list_ranks": true,
                            "list_permissions": true,
                            "query_member": true,
                            "custom_1": false,
                            "custom_2": false,
                            "custom_3": false,
                            "custom_4": false
                        }
                    }
                ]
            }
        }
    }
}
```

# PATCH,PUT,DELETE /api/v1/groups/:id/ranks/:rankId
## Authentication

Body:
- utf8: ✓
- _method: patch
- group_rank[edit_group]: 0
- group_rank[edit_rank]: 0
- group_rank[list_ranks]: 0
- group_rank[list_permissions]: 0
- group_rank[edit_member]: 0
- group_rank[list_members]: 0
- group_rank[query_member]: 0
- commit: Update Rank

Response:
```json
{
	"status": "success",
	"data": {
		"id": "edec8a8f-5f49-47c9-b1ff-561743152592",
		"name": "Test",
		"members_count": 0,
		"permissions": {
			"edit_group": false,
			"edit_rank": true,
			"edit_member": false,
			"list_members": false,
			"list_ranks": true,
			"list_permissions": true,
			"query_member": false,
			"custom_1": false,
			"custom_2": false,
			"custom_3": false,
			"custom_4": false
		}
	}
}
```

# GET /api/v1/groups/:id/members?page=1&per_page=30
## Authentication

Reponse: 
```json
{
    "status": "success",
    "current_page": 1,
    "total_pages": 1,
    "per_page": 30,
    "total_entries": 1,
    "data": {
        "groups": {
            "40cbb5a9-4744-4a25-90bb-7f8ee5a10df4": {
                "members_count": 1,
                "members": [
                    {
                        "username": "Maki",
                        "rank": {
                            "id": "66248e70-1781-4a93-bed8-67782be33734",
                            "name": "owner"
                        }
                    }
                ]
            }
        }
    }
}
```

# POST /api/v1/groups/:id/members
## Authentication

Body:
- utf8: ✓
- group_membership[user]: Caitlyn
- group_membership[rank]: edec8a8f-5f49-47c9-b1ff-561743152592
- commit: Add Member

Reponse: 
```json
{
    "status": "success",
    "data": {
		"username": "Caitlyn",
		"pending": true,
		"rank": {
			"id": "edec8a8f-5f49-47c9-b1ff-561743152592", // rank id
			"name": "Test rank",
		}
    }
}
```

# GET /api/v1/groups/:id/members/:username
## Authentication

what the fuck

Reponse: 
```json
{
	"status": "success",
	"current_page": 1,
	"total_pages": 1,
	"per_page": 30,
	"total_entries": 0, 
    "data": {
		"username": "Caitlyn",
    }
}
```

# PATCH /api/v1/groups/:id/members/:username
## Authentication

Body
- group_membership[rank]: 91a50db0-4a6d-4a7a-a585-53a55afcd20e

Reponse: 
```json
{
    "status": "success",
    "data": {
		"username": "Caitlyn",
		"pending": true,
		"rank": {
			"id": "edec8a8f-5f49-47c9-b1ff-561743152592", // rank id
			"name": "Test rank",
		}
    }
}
```

	# PUT /api/v1/groups/:id/members/:username
	## Authentication

# DELETE /api/v1/groups/:id/members/:username
## Authentication

Works fine

# GET /api/v1/groups/members/:username?groups=Cute
## Authentication

what the fuck again

Reponse: 
```json
{
	"status": "success",
	"current_page": 1,
	"total_pages": 1,
	"per_page": 30,
	"total_entries": 0, 
    "data": {
		"username": "Caitlyn",
    }
}
```

# GET /api/v1/groups
## Authentication

Reponse: 
```json
{
	"status": "success",
	"data": {
		"groups": [
			{
				"id": "40cbb5a9-4744-4a25-90bb-7f8ee5a10df4",
				"name": "Cute",
				"description": null,
				"image": "/images/original/missing.png",
				"is_list": false,
				"members_count": 1,
				"rank": {
					"id":"66248e70-1781-4a93-bed8-67782be33734",
					"name":"owner"
				}
			}
		]
	}
}
```

# GET /api/v1/groups/:id
## Authentication

Reponse: 
```json
{
	"status": "success",
	"data": {
		"groups": {
			"40cbb5a9-4744-4a25-90bb-7f8ee5a10df4": {
				"id": "40cbb5a9-4744-4a25-90bb-7f8ee5a10df4",
				"name": "Cute",
				"description": null,
				"image": "/images/original/missing.png",
				"is_list": false,
				"members_count": 1,
				"rank": {
					"id":"66248e70-1781-4a93-bed8-67782be33734",
					"name":"owner"
				}
			}
		}
	}
}
```
