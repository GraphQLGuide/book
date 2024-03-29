import React, { useState } from 'react'
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Modal,
} from '@material-ui/core'
import {
  MoreVert,
  Favorite,
  FavoriteBorder,
  Star,
  StarBorder,
} from '@material-ui/icons'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import times from 'lodash/times'
import find from 'lodash/find'
import { gql, useMutation } from '@apollo/client'

import { useUser } from '../lib/useUser'
import ReviewForm from './ReviewForm'

const FAVORITE_REVIEW_MUTATION = gql`
  mutation FavoriteReview($id: ObjID!, $favorite: Boolean!) {
    favoriteReview(id: $id, favorite: $favorite) {
      id
      favorited
    }
  }
`

const FavoriteButton = ({ id, favorited }) => {
  const [favorite] = useMutation(FAVORITE_REVIEW_MUTATION, {
    update: (cache, { data: { favoriteReview } }) => {
      cache.modify({
        fields: {
          currentUser(currentUserRef) {
            cache.modify({
              id: currentUserRef.__ref,
              fields: {
                favoriteReviews: (reviewRefs = [], { readField }) =>
                  favoriteReview.favorited
                    ? [...reviewRefs, { __ref: `Review:${id}` }]
                    : reviewRefs.filter(
                        (reviewRef) => readField('id', reviewRef) !== id
                      ),
              },
            })
            return currentUserRef
          },
        },
      })
    },
  })

  function toggleFavorite() {
    favorite({
      variables: { id, favorite: !favorited },
      optimisticResponse: {
        favoriteReview: {
          __typename: 'Review',
          id,
          favorited: !favorited,
        },
      },
    })
  }

  return (
    <IconButton onClick={toggleFavorite}>
      {favorited ? <Favorite /> : <FavoriteBorder />}
    </IconButton>
  )
}

const StarRating = ({ rating }) => (
  <div>
    {times(rating, (i) => (
      <Star key={i} />
    ))}
    {times(5 - rating, (i) => (
      <StarBorder key={i} />
    ))}
  </div>
)

const REMOVE_REVIEW_MUTATION = gql`
  mutation RemoveReview($id: ObjID!) {
    removeReview(id: $id)
  }
`

export default ({ review, testimonial, ...props }) => {
  const { id, text, stars, createdAt, author } = review

  const { user } = useUser()

  const [anchorEl, setAnchorEl] = useState()
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  const [editing, setEditing] = useState(false)

  const [removeReview] = useMutation(REMOVE_REVIEW_MUTATION, {
    update: (cache) => cache.evict({ id: cache.identify(review) }),
  })

  function openMenu(event) {
    setAnchorEl(event.currentTarget)
  }

  function closeMenu() {
    setAnchorEl(null)
  }

  function editReview() {
    closeMenu()
    setEditing(true)
  }

  function deleteReview() {
    closeMenu()
    removeReview({
      variables: { id },
      optimisticResponse: {
        removeReview: true,
      },
    }).catch((e) => {
      if (find(e.graphQLErrors, { message: 'unauthorized' })) {
        alert('👮‍♀️✋ You can only delete your own reviews!')
      }
    })
  }

  const LinkToProfile = ({ children }) => (
    <a
      href={`https://github.com/${author.username}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )

  return (
    <div {...props}>
      <Card className="Review">
        <CardHeader
          avatar={
            testimonial ? (
              <Avatar alt={author.name} src={author.photo} />
            ) : (
              <LinkToProfile>
                <Avatar alt={author.name} src={author.photo} />
              </LinkToProfile>
            )
          }
          action={
            !testimonial &&
            user && (
              <IconButton aria-label="Open menu" onClick={openMenu}>
                <MoreVert />
              </IconButton>
            )
          }
          title={<LinkToProfile>{author.name}</LinkToProfile>}
          subheader={stars && <StarRating rating={stars} />}
        />
        <CardContent>
          {text ? (
            <Typography component="p">{text}</Typography>
          ) : (
            <Typography component="i">Text private</Typography>
          )}
        </CardContent>
        {testimonial ? null : (
          <CardActions>
            <Typography className="Review-created">
              {formatDistanceToNow(createdAt)} ago
            </Typography>
            <div className="Review-spacer" />
            {user && <FavoriteButton {...review} />}
          </CardActions>
        )}
      </Card>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={editReview}>Edit</MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu()
            setDeleteConfirmationOpen(true)
          }}
        >
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
      >
        <DialogTitle>{'Delete review?'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            A better UX is probably just letting you single-click delete with an
            undo toast, but that's harder to code right{' '}
            <span role="img" aria-label="grinning face">
              😄
            </span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmationOpen(false)}>
            Cancel
          </Button>
          <Button onClick={deleteReview} color="primary">
            Sudo delete
          </Button>
        </DialogActions>
      </Dialog>

      <Modal open={editing} onClose={() => setEditing(false)}>
        <ReviewForm done={() => setEditing(false)} review={review} />
      </Modal>
    </div>
  )
}
